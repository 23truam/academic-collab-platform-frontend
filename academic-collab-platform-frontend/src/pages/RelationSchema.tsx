import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as echarts from 'echarts';
import graph from '../assets/les-miserables.json';

interface RelationSchemaProps {
  onNodeClicked: (node: any) => void;
}

const RelationSchema = forwardRef<any, RelationSchemaProps>(({ onNodeClicked }, ref) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useImperativeHandle(ref, () => ({
    highlightNodeInChart: (nodeId: string) => {
      if (!chartInstance.current) return;

      chartInstance.current.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: nodeId,
      });

      // 获取节点数据并居中显示
      const option = chartInstance.current.getOption() as echarts.EChartsOption;
      const nodeData = (option.series as any)[0].data[nodeId];
      if (nodeData && nodeData.x && nodeData.y) {
        chartInstance.current.setOption({
          series: [{
            center: [nodeData.x, nodeData.y]
          }]
        });
      }
    }
  }));

  useEffect(() => {
    const initChart = () => {
      if (chartRef.current) {
        chartInstance.current = echarts.init(chartRef.current, 'dark');

        const option = {
          tooltip: {},
          legend: [
            {
              data: graph.categories.map((a) => a.name),
            },
          ],
          series: [
            {
              name: 'Les Miserables',
              type: 'graph',
              layout: 'none',
              data: graph.nodes,
              links: graph.links,
              categories: graph.categories,
              roam: true,
              label: {
                show: true,
                position: 'right',
                formatter: '{b}',
              },
              labelLayout: {
                hideOverlap: true,
              },
              scaleLimit: {
                min: 0.4,
                max: 2,
              },
              lineStyle: {
                color: 'source',
                curveness: 0.3,
              },
            },
          ],
        };

        chartInstance.current.setOption(option);

        // 添加点击事件监听
        chartInstance.current.on('click', (params) => {
          if (
            params.componentType === 'series' &&
            params.seriesType === 'graph' &&
            params.dataType === 'node'
          ) {
            onNodeClicked(params.data);
          }
        });

        // 添加窗口大小变化的监听
        const handleResize = () => {
          chartInstance.current?.resize();
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }
    };

    initChart();

    // 组件卸载时清理
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [onNodeClicked]);

  return (
    <div 
      ref={chartRef} 
      style={{ width: '100%', height: '100%' }}
    />
  );
});

export default RelationSchema;