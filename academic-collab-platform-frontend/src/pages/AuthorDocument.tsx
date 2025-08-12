import React, { useState, useEffect } from 'react';
import { Layout, Form, Select, Button, Card, List, Avatar, Typography, message } from 'antd';
import { useLocation } from 'react-router-dom';
import '../styles/AuthorDocument.css';
import * as echarts from 'echarts';
import avatar from '../assets/anonymous-avatar.jpg';
import { getAllAuthors, getAuthorDetail } from '../services/authorService';

const { Header, Content } = Layout;
const { Option } = Select;
const { Text } = Typography;

const AuthorDocument: React.FC = () => {
    const location = useLocation();
    const [inputValue, setInputValue] = useState('');
    const [authors, setAuthors] = useState<string[]>([]);
    const [relatedAuthors, setRelatedAuthors] = useState<string[]>([]);
    const [chartData, setChartData] = useState<any>({});
    const [papers, setPapers] = useState<any[]>([]);
    const chartRef = React.useRef<HTMLDivElement>(null);
    const collaborationChartRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        getAllAuthors().then(setAuthors);
    }, []);

    useEffect(() => {
        if (location.state && location.state.author) {
            setInputValue(location.state.author);
                }
    }, [location.state]);

    useEffect(() => {
        if (!inputValue) return;
        getAuthorDetail(inputValue).then(data => {
            setPapers(data.papers || []);
            setRelatedAuthors(data.relatedAuthors || []);
            const years = Object.keys(data.stats || {});
            const values = years.map(y => data.stats[y]);
            setChartData({ years, values });
        renderChart(years, values);
            renderCollaborationChart(data.papers || []);
        }).catch(() => {
            message.error('获取作者信息失败');
            setPapers([]);
            setRelatedAuthors([]);
            setChartData({ years: [], values: [] });
            if (chartRef.current) echarts.init(chartRef.current).clear();
            if (collaborationChartRef.current) echarts.init(collaborationChartRef.current).clear();
            });
    }, [inputValue]);

    const handleInputChange = (value: string) => setInputValue(value);
    const handleSubmit = () => setInputValue(inputValue);

    const renderChart = (years: string[], values: number[]) => {
        if (chartRef.current) {
            const chartInstance = echarts.init(chartRef.current);
            const option = {
                title: { text: '' },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: years },
                yAxis: { type: 'value' },
                series: [{
                    name: '文献数量',
                    type: 'line',
                    data: values,
                    itemStyle: { color: '#1890ff' },
                    areaStyle: { color: 'rgba(24, 144, 255, 0.2)' },
                    lineStyle: { type: 'dashed' },
                    symbol: 'circle',
                    symbolSize: 8,
                    smooth: true,
                    animationDuration: 2000,
                }],
            };
            chartInstance.setOption(option);
        }
    };

    const renderCollaborationChart = (papers: any[]) => {
        if (collaborationChartRef.current) {
            const { nodes, links } = generateCollaborationData(papers);
            const chartInstance = echarts.init(collaborationChartRef.current);
            const option = {
                title: { text: '合作者关系图' },
                tooltip: {},
                series: [{
                    type: 'graph',
                    layout: 'force',
                    data: nodes,
                    links: links,
                    roam: true,
                    label: {
                        show: true,
                        position: 'right',
                        formatter: '{b}',
                        fontSize: 12,
                        color: '#333',
                    },
                    lineStyle: { color: 'source', curveness: 0.3 },
                    force: { repulsion: 100 },
                }],
            };
            chartInstance.setOption(option);
        }
    };

    const generateCollaborationData = (papers: any[]) => {
        const nodes: { id: string, name: string }[] = [];
        const links: { source: string, target: string }[] = [];
        const authorSet = new Set<string>();
        papers.forEach((item: any) => {
            (item.authorsList || []).forEach((author: string) => {
                if (!authorSet.has(author)) {
                    nodes.push({ id: author, name: author });
                    authorSet.add(author);
                }
            });
            for (let i = 0; i < (item.authorsList || []).length; i++) {
                for (let j = i + 1; j < (item.authorsList || []).length; j++) {
                    links.push({ source: item.authorsList[i], target: item.authorsList[j] });
                }
            }
        });
        return { nodes, links };
    };

    const handleAuthorClick = (author: string) => setInputValue(author);

    // getAuthorBio 保持原逻辑
    const getAuthorBio = (author: string) => {
        if (author === 'J') {
            return {
                title: '量子计算研究者',
                bio: 'J教授是量子计算领域的先驱研究者，专注于量子算法和量子信息理论的研究。曾在IBM量子计算研究中心工作，目前带领团队探索量子优势和量子纠错等前沿课题。',
                research: ['量子计算', '量子信息', '量子算法'],
                education: [
                    '博士学位 - 量子物理学，麻省理工学院',
                    '硕士学位 - 理论物理学，加州理工学院',
                    '学士学位 - 物理与计算机科学，普林斯顿大学'
                ],
                awards: [
                    '2023 - 量子计算创新奖',
                    '2020 - 量子信息科学杰出贡献奖',
                    '2017 - 青年科学家奖'
                ]
            };
        } else if (author === 'TAM') {
            return {
                title: '人工智能与机器学习专家',
                bio: 'TAM教授是人工智能领域的顶尖研究者，专注于深度学习和强化学习算法的研究。曾在谷歌大脑和DeepMind工作，开创了多项前沿AI技术，在自然语言处理和计算机视觉领域有重要贡献。',
                research: ['深度学习', '强化学习', '神经网络架构搜索'],
                education: [
                    '博士学位 - 计算机科学，斯坦福大学',
                    '硕士学位 - 机器学习，卡内基梅隆大学',
                    '学士学位 - 数学与计算机科学，加州大学伯克利分校'
                ],
                awards: [
                    '2023 - AI研究杰出成就奖',
                    '2021 - AAAI/IJCAI最佳论文奖',
                    '2018 - ACM计算智能新锐奖'
                ]
            };
        } else {
            return {
                title: '教授 / 研究员',
                bio: `${author}是计算机科学领域的知名学者，专注于人工智能和机器学习研究。在学术界有着丰富的经验，已发表多篇高质量论文，并与众多研究者建立了合作关系。`,
                research: ['人工智能', '机器学习', '数据分析'],
                education: [
                    '博士学位 - 计算机科学，斯坦福大学',
                    '硕士学位 - 人工智能，麻省理工学院',
                    '学士学位 - 计算机工程，清华大学'
                ],
                awards: [
                    '2022 - 人工智能杰出贡献奖',
                    '2020 - 最佳论文奖 (AAAI)',
                    '2018 - 青年科学家奖'
                ]
            };
        }
    };

    const authorInfo = getAuthorBio(inputValue);

    return (
        <Layout>
            <Header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#001529' }}>
                <Form layout="inline" onFinish={handleSubmit}>
                    <Form.Item>
                        <Select
                            showSearch
                            value={inputValue}
                            onChange={handleInputChange}
                            style={{ width: 300 }}
                            placeholder="搜索或选择作者"
                            optionFilterProp="children"
                        >
                            {authors.map((author, index) => (
                                <Option key={index} value={author}>{author}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">提交</Button>
                    </Form.Item>
                </Form>
            </Header>
            <Content style={{ padding: '20px', backgroundColor: '#f0f2f5' }}>
                <div className="layout">
                    <Card className="profile" title="个人简介" bordered={false} hoverable style={{ backgroundColor: '#fafafa' }}>
                        <div className="profile-content">
                            <div className="profile-header">
                                <Avatar src={avatar} size={100} />
                                <div className="profile-info">
                                    <h2 className="profile-name">{inputValue}</h2>
                                    <p className="profile-title">{authorInfo.title}</p>
                                    <div className="profile-stats">
                                        <div className="stat-item">
                                            <span className="stat-value">{papers.length}</span>
                                            <span className="stat-label">发表论文</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">{relatedAuthors.length}</span>
                                            <span className="stat-label">合作者</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="profile-details">
                                <h3>研究领域</h3>
                                <div className="research-tags">
                                    {authorInfo.research.map((tag, index) => (
                                        <span key={index} className="research-tag">{tag}</span>
                                    ))}
                                </div>
                                <h3 className="mt-4">简介</h3>
                                <p className="bio">
                                    {authorInfo.bio}
                                </p>
                                <h3 className="mt-4">教育背景</h3>
                                <ul className="education-list">
                                    {authorInfo.education.map((edu, index) => (
                                        <li key={index}>{edu}</li>
                                    ))}
                                </ul>
                                <h3 className="mt-4">荣誉奖项</h3>
                                <ul className="awards-list">
                                    {authorInfo.awards.map((award, index) => (
                                        <li key={index}>{award}</li>
                                    ))}
                                </ul>
                                <h3 className="mt-4">联系方式</h3>
                                <div className="contact-info">
                                    <p><strong>邮箱：</strong>professor@university.edu</p>
                                    <p><strong>办公室：</strong>计算机科学楼 A-304</p>
                                    <p><strong>个人主页：</strong><a href={`#`}>http://scholar.university.edu/{inputValue}</a></p>
                                </div>
                                <h3 className="mt-4">主要合作者</h3>
                                <div className="collaborators">
                                    {relatedAuthors.slice(0, 3).map((author, index) => (
                                        <span 
                                            key={index} 
                                            className="collaborator-tag"
                                            onClick={() => handleAuthorClick(author)}
                                        >
                                            {author}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card className="publications" title={`${inputValue} 的文献数量`} bordered={false} hoverable style={{ backgroundColor: '#fafafa' }}>
                        <div ref={chartRef} style={{ width: '100%', height: '200px' }}></div>
                        <List
                            header={<div>发表的论文</div>}
                            bordered
                            dataSource={papers || []}
                            renderItem={item => (
                                <List.Item>
                                    <div>
                                        <Text strong>{item.title}</Text>
                                        <div className="authors">
                                            {(item.authorsList || []).map((author: string, index: number) => (
                                                <span key={index}>
                                                    <span
                                                        style={{
                                                            color: author === inputValue ? 'orange' : 'green',
                                                            marginRight: '5px',
                                                        }}
                                                    >
                                                        {author}
                                                    </span>
                                                    {index < (item.authorsList?.length || 0) - 1 && (
                                                        <span style={{ color: 'black' }}>, </span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                        <div>
                                            <span>年份: {item.year || '未知'}</span>
                                        </div>
                                        {item.abstractText && (
                                            <div>
                                                <span>摘要: {item.abstractText}</span>
                                            </div>
                                        )}
                                        {item.url && (
                                            <div>
                                                <a href={item.url} target="_blank" rel="noopener noreferrer">论文链接</a>
                                            </div>
                                        )}
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>
                    <Card className="related-authors" title="合作作者" bordered={false} hoverable style={{ backgroundColor: '#fafafa' }}>
                        <div ref={collaborationChartRef} style={{ width: '100%', height: '400px' }}></div>
                        <List
                            dataSource={relatedAuthors || []}
                            renderItem={item => (
                                <List.Item onClick={() => handleAuthorClick(item)} style={{ cursor: 'pointer' }}>
                                    {item}
                                </List.Item>
                            )}
                        />
                    </Card>
                </div>
            </Content>
        </Layout>
    );
};

export default AuthorDocument;