// frontend/src/pages/CollaborationAnalysisPage.tsx
import React from 'react';
import { useState } from 'react';
import axios from 'axios';

type Collaborator = {
    name: string;
    similarity: string;
}

const CollaborationAnalysisPage: React.FC = () => {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const tags = ['AI', 'Data Science', 'Machine Learning', 'NLP', 'Robotics'];

    const handleTagClick = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const fetchCollaborators = async () => {
        try {
            const response = await axios.post('http://localhost:8081/api/collaboration', {
                tags: selectedTags,
            });
            setCollaborators(response.data.collaborators);
        } catch (error) {
            console.error('Error fetching collaborators', error);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Collaboration Analysis</h1>
            <div className="flex flex-wrap mb-4">
                {tags.map((tag) => (
                    <button
                        key={tag}
                        className={`m-2 p-2 border rounded ${
                            selectedTags.includes(tag) ? 'bg-blue-500 text-white' : 'bg-gray-200'
                        }`}
                        onClick={() => handleTagClick(tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>
            <button className="p-2 bg-green-500 text-white rounded" onClick={fetchCollaborators}>Analyze</button>
            <div className="mt-8 grid grid-cols-3 gap-4">
                {collaborators.map((collaborator) => (
                    <div key={collaborator.name} className="p-4 border rounded shadow-md">
                        <img src="../assets/anonymous-avatar.jpg" alt="Anonymous" className="mb-2" />
                        <h2 className="text-xl font-bold">{collaborator.name}</h2>
                        <p>Similarity: {collaborator.similarity}%</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CollaborationAnalysisPage;
