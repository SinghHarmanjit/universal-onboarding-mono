import React from 'react';
import { DiscoveredResource } from '../../types/resources';

interface ResourcesListProps {
  resources: DiscoveredResource[];
}

export const ResourcesList: React.FC<ResourcesListProps> = ({ resources }) => {
  if (resources.length === 0) {
    return (
      <p className="placeholder">
        Relevant resources will appear here as you chat.
      </p>
    );
  }

  return (
    <ul className="resource-list">
      {resources.map((r, i) => (
        <li key={i} className="resource-item">
          {r.url ? (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
            >
              {r.title ?? r.source ?? r.url}
            </a>
          ) : (
            <span>{r.title ?? r.source}</span>
          )}
        </li>
      ))}
    </ul>
  );
};
