import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export function TestResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading resources...');
        const resourcesData = await api.getResources();
        console.log('Resources loaded:', resourcesData);
        setResources(resourcesData);
      } catch (err) {
        console.error('Error loading resources:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Loading resources...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Resources Test Page</h1>
      <p>Found {resources.length} resources</p>
      <ul>
        {resources.map((resource: any) => (
          <li key={resource.id}>
            <strong>{resource.title}</strong> - {resource.resource_type} - {resource.category}
          </li>
        ))}
      </ul>
    </div>
  );
}