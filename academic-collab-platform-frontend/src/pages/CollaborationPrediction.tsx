import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Select, Button, Tag, Row, Col, Typography, Divider, Slider, List, Avatar, Spin } from 'antd';
import * as echarts from 'echarts';
import dblp from '../assets/dblp.json';
import '../styles/CollaborationPrediction.css';
import { getAllAuthorsWithId } from '../services/authorService';
import { predictCollaborators, CollaborationPredictRequest } from '../services/collaborationService';

const { Option } = Select;
const { Title, Text } = Typography;

// 研究方向选项
const researchDirections = [
    { value: 'ai', label: '人工智能' },
    { value: 'ml', label: '机器学习' },
    { value: 'nlp', label: '自然语言处理' },
    { value: 'cv', label: '计算机视觉' },
    { value: 'db', label: '数据库' },
    { value: 'se', label: '软件工程' },
    { value: 'iot', label: '物联网' },
    { value: 'security', label: '网络安全' },
    { value: 'cloud', label: '云计算' },
    { value: 'distributed', label: '分布式系统' }
];

interface Indicator {
    name: string;
    value: number;
}

interface Collaborator {
    name: string;
    paperCount: number;
    commonCoauthors: number;
    directionScore: string;
    totalScore: string;
    scoreValue: number;
    indicators: Indicator[];
}

// 计算余弦相似度
const cosineSimilarity = (vec1: number[], vec2: number[]): number => {
    if (vec1.length !== vec2.length) return 0;
    let dotProduct = 0, norm1 = 0, norm2 = 0;
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }
    if (norm1 === 0 && norm2 === 0) return 1; // 两个全零向量，认为完全相似
    if (norm1 === 0 || norm2 === 0) return 0; // 其中一个全零，认为完全不相似
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

// 计算JS散度
const jsDivergence = (p: number[], q: number[]): number => {
    if (p.length !== q.length) return 1;
    const normalize = (arr: number[]) => {
        const sum = arr.reduce((a, b) => a + b, 0);
        if (sum === 0) return arr.map(_ => 1 / arr.length); // 全零向量，返回均匀分布
        return arr.map(x => x / sum);
    };
    const p_norm = normalize(p);
    const q_norm = normalize(q);
    const m = p_norm.map((x, i) => (x + q_norm[i]) / 2);
    const kl = (a: number[], b: number[]) =>
        a.reduce((sum, ai, i) => ai === 0 ? sum : sum + ai * Math.log(ai / b[i]), 0);
    return (kl(p_norm, m) + kl(q_norm, m)) / 2;
};

// 获取作者的研究方向向量
const getAuthorDirectionVector = (papers: any[], directions: string[]): number[] => {
    try {
        console.log('开始计算研究方向向量，论文数量:', papers?.length);
        console.log('研究方向:', directions);
        
        const vector = new Array(directions.length).fill(0);
        
        // 如果没有论文数据，返回零向量
        if (!papers || papers.length === 0) {
            console.log('警告：没有找到论文数据');
            return vector;
        }
        
        // 记录每个方向的匹配次数
        let totalMatches = 0;
        
        papers.forEach((paper, index) => {
            try {
                // 如果没有研究方向标签，根据标题和摘要推断
                if (!paper.directions) {
                    const title = paper.title?.toLowerCase() || '';
                    console.log(`处理第${index + 1}篇论文，标题:`, title);
                    
                    directions.forEach((dir, dirIndex) => {
                        const keywords = {
                            'ai': ['artificial intelligence', 'ai', '智能'],
                            'ml': ['machine learning', 'ml', '机器学习'],
                            'nlp': ['natural language', 'nlp', '自然语言'],
                            'cv': ['computer vision', 'cv', '计算机视觉'],
                            'db': ['database', 'db', '数据库'],
                            'se': ['software engineering', 'se', '软件工程'],
                            'iot': ['internet of things', 'iot', '物联网'],
                            'security': ['security', 'cybersecurity', '安全'],
                            'cloud': ['cloud', 'cloud computing', '云计算'],
                            'distributed': ['distributed', 'distributed systems', '分布式']
                        };
                        
                        const matched = keywords[dir as keyof typeof keywords]?.some(keyword => title.includes(keyword));
                        if (matched) {
                            vector[dirIndex]++;
                            totalMatches++;
                            console.log(`找到匹配：${dir} - ${title}`);
                        }
                    });
                } else {
                    paper.directions.forEach((dir: string) => {
                        const index = directions.indexOf(dir);
                        if (index !== -1) {
                            vector[index]++;
                            totalMatches++;
                            console.log(`找到研究方向标签：${dir}`);
                        }
                    });
                }
            } catch (paperError) {
                console.error(`处理第${index + 1}篇论文时出错:`, paperError);
            }
        });
        
        console.log('研究方向匹配统计:', {
            totalMatches,
            vector,
            directions
        });
        
        // 如果没有任何匹配，使用基于论文数量的分布
        if (totalMatches === 0) {
            console.log('没有找到研究方向匹配，使用基于论文数量的分布');
            const paperCount = papers.length;
            directions.forEach((_, index) => {
                // 使用不同的权重来区分研究方向
                const weights = [0.3, 0.25, 0.2, 0.15, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05];
                vector[index] = Math.round(paperCount * weights[index]);
            });
        }
        
        if (vector.every(v => v === 0)) {
            // 均匀分布兜底
            for (let i = 0; i < vector.length; i++) vector[i] = 1;
        }
        
        return vector;
    } catch (error) {
        console.error('计算研究方向向量时出错:', error);
        // 返回一个默认向量
        return new Array(directions.length).fill(1);
    }
};

const CollaborationPrediction: React.FC = () => {
    // 状态
    const [selectedAuthor, setSelectedAuthor] = useState<string>('');
    const [allAuthors, setAllAuthors] = useState<string[]>([]);
    const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
    const [yearRange, setYearRange] = useState<[number, number]>([2010, 2023]);
    const [minPapers, setMinPapers] = useState<number>(3);
    const [potentialCollaborators, setPotentialCollaborators] = useState<Collaborator[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [authorIdMap, setAuthorIdMap] = useState<{ [name: string]: number }>({});
    
    // 图表引用
    const radarChartRef = useRef<HTMLDivElement>(null);
    const networkChartRef = useRef<HTMLDivElement>(null);
    // 保存图表实例
    const radarChartInstance = useRef<echarts.ECharts | null>(null);
    const networkChartInstance = useRef<echarts.ECharts | null>(null);

    // 初始化作者列表和ID映射
    useEffect(() => {
        getAllAuthorsWithId().then(list => {
            setAllAuthors(list.map((a: any) => a.name));
            const map: { [name: string]: number } = {};
            list.forEach((a: any) => { map[a.name] = a.id; });
            setAuthorIdMap(map);
        });
    }, []);

    // 添加窗口大小变化监听，调整图表大小
    useEffect(() => {
        const handleResize = () => {
            if (radarChartInstance.current) {
                radarChartInstance.current.resize();
            }
            if (networkChartInstance.current) {
                networkChartInstance.current.resize();
            }
        };

        window.addEventListener('resize', handleResize);

        // 组件卸载时清除事件监听
        return () => {
            window.removeEventListener('resize', handleResize);
            // 销毁图表实例
            if (radarChartInstance.current) {
                radarChartInstance.current.dispose();
                radarChartInstance.current = null;
            }
            if (networkChartInstance.current) {
                networkChartInstance.current.dispose();
                networkChartInstance.current = null;
            }
        };
    }, []);

    // 处理作者选择
    const handleAuthorChange = (value: string) => {
        setSelectedAuthor(value);
    };

    // 处理研究方向选择
    const handleDirectionChange = (values: string[]) => {
        setSelectedDirections(values);
    };

    // 处理年份范围变化
    const handleYearRangeChange = (value: [number, number]) => {
        setYearRange(value);
    };

    // 处理最小论文数量变化
    const handleMinPapersChange = (value: number) => {
        setMinPapers(value);
    };

    // 计算合作可能性（调用后端）
    const calculateCollaborationPotential = async () => {
        if (!selectedAuthor || selectedDirections.length === 0) {
            setErrorMessage('请选择作者和研究方向');
            return;
        }
        setIsLoading(true);
        setErrorMessage('');
        try {
            const authorId = authorIdMap[selectedAuthor];
            if (!authorId) {
                setErrorMessage('未找到该作者ID');
                setIsLoading(false);
                return;
            }
            
            console.log('开始预测合作者，参数:', {
                authorId,
                authorName: selectedAuthor,
                directions: selectedDirections,
                minPapers,
                yearRange
            });
            
            const params: CollaborationPredictRequest = {
                authorId,
                directions: selectedDirections,
                minPapers,
                startYear: yearRange[0],
                endYear: yearRange[1]
            };
            
            console.log('发送请求到后端:', params);
            const data = await predictCollaborators(params);
            console.log('后端返回数据:', data);
            
            setPotentialCollaborators(data);
        } catch (e) {
            console.error('合作预测失败:', e);
            setErrorMessage(`分析过程中发生错误: ${e instanceof Error ? e.message : '未知错误'}`);
        }
        setIsLoading(false);
    };

    // 渲染雷达图
    const renderRadarChart = () => {
        if (!radarChartRef.current || potentialCollaborators.length === 0) {
            return;
        }

        // 先销毁现有实例
        if (radarChartInstance.current) {
            radarChartInstance.current.dispose();
        }
        
        // 直接在DOM元素上设置内联样式
        const radarContainer = radarChartRef.current;
        radarContainer.style.width = '100%';
        radarContainer.style.height = '350px';
        
        // 使用简单直接的方式初始化图表
        const chartInstance = echarts.init(radarContainer);
        radarChartInstance.current = chartInstance;
        
        const topCollaborator = potentialCollaborators[0];
        
        // 极简化配置
        const option = {
            backgroundColor: '#ffffff',
            title: {
                text: '合作潜力分析',
                left: 'center',
                top: 10
            },
            tooltip: {},
            legend: {
                data: [topCollaborator.name],
                bottom: 5
            },
            radar: {
                shape: 'circle',
                indicator: [
                    { name: '论文数量', max: Math.max(10, Math.ceil(topCollaborator.indicators[0].value * 1.2)) },
                    { name: '共同合作者', max: Math.max(10, Math.ceil(topCollaborator.indicators[1].value * 1.2)) },
                    { name: '研究方向匹配度', max: 10 }
                ]
            },
            series: [
                {
                    type: 'radar',
                    data: [
                        {
                            value: topCollaborator.indicators.map((i: Indicator) => i.value),
                            name: topCollaborator.name,
                            areaStyle: {
                                color: 'rgba(64, 158, 255, 0.6)'
                            }
                        }
                    ]
                }
            ]
        };
        
        // 设置选项并强制更新
        chartInstance.setOption(option);
        chartInstance.resize();
    };

    // 渲染合作网络图
    const renderNetworkChart = () => {
        if (!networkChartRef.current || potentialCollaborators.length === 0) {
            return;
        }
        
        // 先销毁现有实例
        if (networkChartInstance.current) {
            networkChartInstance.current.dispose();
        }
        
        // 直接在DOM元素上设置内联样式
        const networkContainer = networkChartRef.current;
        networkContainer.style.width = '100%';
        networkContainer.style.height = '350px';
        
        // 使用简单直接的方式初始化图表
        const chartInstance = echarts.init(networkContainer);
        networkChartInstance.current = chartInstance;
        
        // 简化的图表节点和连线数据
        const nodes = [
            { name: selectedAuthor, value: 40, category: 0, itemStyle: { color: '#409EFF' } },
            ...potentialCollaborators.slice(0, 5).map((coauthor, index) => ({
                name: coauthor.name,
                value: 20 + coauthor.scoreValue * 10,
                category: 1,
                itemStyle: { color: '#67C23A' }
            }))
        ];
        
        const links = potentialCollaborators.slice(0, 5).map(coauthor => ({
            source: selectedAuthor,
            target: coauthor.name,
            lineStyle: {
                width: 2
            }
        }));
        
        // 极简化配置
        const option = {
            backgroundColor: '#ffffff',
            title: {
                text: '潜在合作网络',
                left: 'center',
                top: 10
            },
            tooltip: {},
            legend: [
                {
                    data: ['当前作者', '潜在合作者'],
                    orient: 'horizontal',
                    bottom: 5
                }
            ],
            animationDuration: 1500,
            series: [
                {
                    name: '合作关系',
                    type: 'graph',
                    layout: 'circular',
                    circular: {
                        rotateLabel: true
                    },
                    data: nodes,
                    links: links,
                    categories: [
                        { name: '当前作者' },
                        { name: '潜在合作者' }
                    ],
                    roam: true,
                    label: {
                        show: true,
                        position: 'right',
                        formatter: '{b}'
                    },
                    lineStyle: {
                        color: 'source',
                        curveness: 0.3
                    }
                }
            ]
        };
        
        // 设置选项并强制更新
        chartInstance.setOption(option);
        chartInstance.resize();
    };

    // 组件加载时和状态更新时初始化图表
    useEffect(() => {
        // 如果有潜在合作者数据，确保图表渲染
        if (potentialCollaborators.length > 0 && !isLoading) {
            // 给DOM一点时间更新
            const timer = setTimeout(() => {
                if (radarChartRef.current && networkChartRef.current) {
                    // 确保清理之前的实例
                    if (radarChartInstance.current) {
                        radarChartInstance.current.dispose();
                    }
                    if (networkChartInstance.current) {
                        networkChartInstance.current.dispose();
                    }
                    
                    // 重新渲染图表
                    renderRadarChart();
                    renderNetworkChart();
                }
            }, 300);
            
            return () => {
                clearTimeout(timer);
            };
        }
    }, [potentialCollaborators, isLoading]);

    // 组件卸载时清理图表实例
    useEffect(() => {
        return () => {
            if (radarChartInstance.current) {
                radarChartInstance.current.dispose();
                radarChartInstance.current = null;
            }
            if (networkChartInstance.current) {
                networkChartInstance.current.dispose();
                networkChartInstance.current = null;
            }
        };
    }, []);

    return (
        <div className="collaboration-prediction-container">
            <div className="header">
                <Title level={2}>合作者预测</Title>
                <Text className="subtitle">分析并预测可能的研究合作伙伴</Text>
            </div>
            
            <Row gutter={24}>
                <Col span={24} md={12} lg={8}>
                    <Card title="设置参数" className="settings-card">
                        <div className="form-item">
                            <label>选择学者</label>
                            <Select
                                showSearch
                                placeholder="输入或选择学者姓名"
                                optionFilterProp="children"
                                onChange={handleAuthorChange}
                                style={{ width: '100%' }}
                            >
                                {allAuthors.map(author => (
                                    <Option key={author} value={author}>{author}</Option>
                                ))}
                            </Select>
                        </div>
                        
                        <div className="form-item">
                            <label>研究方向（多选）</label>
                            <Select
                                mode="multiple"
                                placeholder="选择您的研究方向"
                                onChange={handleDirectionChange}
                                style={{ width: '100%' }}
                            >
                                {researchDirections.map(dir => (
                                    <Option key={dir.value} value={dir.value}>{dir.label}</Option>
                                ))}
                            </Select>
                        </div>
                        
                        <div className="form-item">
                            <label>发表年份范围</label>
                            <Slider
                                range
                                min={2000}
                                max={2023}
                                defaultValue={yearRange}
                                onChange={handleYearRangeChange as any}
                            />
                            <div className="year-range-display">
                                <span>{yearRange[0]}</span>
                                <span>{yearRange[1]}</span>
                            </div>
                        </div>
                        
                        <div className="form-item">
                            <label>最少论文数量: {minPapers}</label>
                            <Slider
                                min={1}
                                max={10}
                                defaultValue={minPapers}
                                onChange={handleMinPapersChange}
                            />
                        </div>
                        
                        <Button 
                            type="primary" 
                            block 
                            onClick={calculateCollaborationPotential}
                            disabled={!selectedAuthor || selectedDirections.length === 0 || isLoading}
                            loading={isLoading}
                        >
                            {isLoading ? '分析中...' : '分析合作可能性'}
                        </Button>
                    </Card>
                </Col>
                
                <Col span={24} md={12} lg={16}>
                    <Card title="分析结果" className="results-card">
                        {isLoading ? (
                            <div className="empty-results">
                                <Spin size="large" tip="正在分析合作可能性..." />
                            </div>
                        ) : errorMessage ? (
                            <div className="empty-results">
                                <div className="empty-icon">⚠️</div>
                                <p>{errorMessage}</p>
                                <Button type="link" onClick={() => setErrorMessage('')}>重试</Button>
                            </div>
                        ) : potentialCollaborators.length > 0 ? (
                            <>
                                <div className="charts-container">
                                    <div 
                                        ref={radarChartRef} 
                                        className="radar-chart" 
                                        id="radar-chart"
                                        style={{ width: '100%', height: '350px', minHeight: '350px' }}
                                    ></div>
                                    <div 
                                        ref={networkChartRef} 
                                        className="network-chart" 
                                        id="network-chart"
                                        style={{ width: '100%', height: '350px', minHeight: '350px' }}
                                    ></div>
                                </div>
                                
                                <Divider>潜在合作伙伴</Divider>
                                
                                <List
                                    itemLayout="horizontal"
                                    dataSource={potentialCollaborators}
                                    renderItem={item => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>{item.name.charAt(0)}</Avatar>}
                                                title={item.name}
                                                description={
                                                    <div className="collaborator-details">
                                                        <div className="detail-item">
                                                            <span className="label">论文数量:</span>
                                                            <span className="value">{item.paperCount}</span>
                                                        </div>
                                                        <div className="detail-item">
                                                            <span className="label">共同合作者:</span>
                                                            <span className="value">{item.commonCoauthors}</span>
                                                        </div>
                                                        <div className="detail-item">
                                                            <span className="label">研究方向匹配度:</span>
                                                            <span className="value">{item.directionScore}</span>
                                                        </div>
                                                    </div>
                                                }
                                            />
                                            <div className="total-score">
                                                <div className="score-circle">
                                                    {item.totalScore}
                                                </div>
                                                <span>匹配度</span>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            </>
                        ) : (
                            <div className="empty-results">
                                <div className="empty-icon">📊</div>
                                <p>请设置参数并点击"分析合作可能性"按钮</p>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default CollaborationPrediction; 