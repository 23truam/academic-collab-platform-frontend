import React, { useState, useRef } from 'react';
import RelationSchema from './RelationSchema';
import graph from '../assets/les-miserables.json';
import '../styles/NodeList.css';

// 定义标签映射关系
const categoryMap: { [key: string]: string } = {
  '0': '自然语言处理',
  '1': '机器学习',
  '2': '数据科学',
  '3': '数据挖掘',
  '4': '操作系统',
  '5': '计算机网络',
  '6': '深度学习',
  '7': '强化学习',
  '8': '生物信息学'
};

const NodeList: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [coverNodeId, setCoverNodeId] = useState<string | null>(null);
  const relationSchemaRef = useRef<any>(null);

  const handleNodeClick = (node: any) => {
    setSelectedNodeId(node.id);
    relationSchemaRef.current?.highlightNodeInChart(node.id);
    scrollToNode(node.id);
  };

  const scrollToNode = (nodeId: string) => {
    const nodeElement = document.getElementById(`node-${nodeId}`);
    if (nodeElement) {
      nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 渲染标签
  const renderTags = (node: any) => {
    // 如果节点有 category 属性，将其转换为数组
    if (typeof node.category === 'number') {
      return (
        <span key={node.category} className="tag">
          {categoryMap[node.category] || `分类${node.category}`}
        </span>
      );
    }
    
    // 如果节点有 categories 数组
    if (Array.isArray(node.categories)) {
      return node.categories.map((category: string, index: number) => (
        <span key={index} className="tag">
          {category}
        </span>
      ));
    }

    // 如果有 tags 属性
    if (Array.isArray(node.tags)) {
      return node.tags.map((tag: string, index: number) => (
        <span key={index} className="tag">
          {tag}
        </span>
      ));
    }

    return null;
  };

  const renderNodeItem = (node: any) => (
    <div
      key={node.id}
      id={`node-${node.id}`}
      className={`node-item ${
        node.id === selectedNodeId ? 'is-selected' : ''
      } ${node.id === coverNodeId ? 'is-covered' : ''}`}
      onMouseOver={() => setCoverNodeId(node.id)}
      onMouseLeave={() => setCoverNodeId(null)}
      onClick={() => handleNodeClick(node)}
    >
      <div className="node-name">{node.name}</div>
      <div className="node-tags">
        {renderTags(node)}
      </div>
    </div>
  );

  return (
    <div className="relation-container">
      <div className="side-panel left-panel">
        {graph.nodes.slice(0, graph.nodes.length / 2).map(renderNodeItem)}
      </div>

      <div className="center-panel">
        <RelationSchema
          ref={relationSchemaRef}
          onNodeClicked={handleNodeClick}
        />
      </div>

      <div className="side-panel right-panel">
        {graph.nodes.slice(graph.nodes.length / 2).map(renderNodeItem)}
      </div>
    </div>
  );
};

export default NodeList;