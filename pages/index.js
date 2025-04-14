// pages/index.js
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

const traits = ["Curious", "Ironic", "Analytical", "Tribalist", "Anger-prone"];

const sampleVideos = {
  centrist: [
    { id: "dQw4w9WgXcQ", title: "Is Climate Change Real? A Balanced Discussion", channel: "Science Talks", views: "1.2M views", uploaded: "3 days ago", reason: "Matches centrist science & tech interest" },
    { id: "9bZkp7q19f0", title: "The Future of AI: Opportunities & Risks", channel: "Tech Insight", views: "842K views", uploaded: "1 week ago", reason: "Trending AI topic with moderate appeal" },
  ],
  radical_left: [
    { id: "3fumBcKC6RE", title: "Capitalism is Failing Us", channel: "Revolt Media", views: "2.3M views", uploaded: "2 days ago", reason: "Popular with users who engage with anti-capitalist narratives" },
    { id: "2ZIpFytCSVc", title: "The Truth About Colonial History", channel: "History Reclaimed", views: "1.1M views", uploaded: "5 days ago", reason: "Recommended due to interest in social justice history" },
  ],
  radical_right: [
    { id: "MtN1YnoL46Q", title: "Why Traditional Values Matter", channel: "Patriot Vision", views: "3.4M views", uploaded: "1 day ago", reason: "Aligns with culturally conservative themes" },
    { id: "tgbNymZ7vqY", title: "The Real Agenda of Globalism", channel: "Unfiltered Truth", views: "2.8M views", uploaded: "4 days ago", reason: "Appeals to viewers with nationalist skepticism" },
  ]
};

const defaultPersona = () => ({ politics: 50, traits: [], interactions: {}, feed: [], timeline: [] });

export default function Home() {
  const [personas, setPersonas] = useState({ A: defaultPersona(), B: defaultPersona() });

  const generateFeeds = () => {
    const getFeed = (p, interactions) => {
      if ((interactions['3fumBcKC6RE'] || 0) > 2) return [...sampleVideos.radical_left];
      if ((interactions['MtN1YnoL46Q'] || 0) > 2) return [...sampleVideos.radical_right];
      if (p < 30) return [...sampleVideos.radical_left];
      else if (p > 70) return [...sampleVideos.radical_right];
      return [...sampleVideos.centrist];
    };

    setPersonas(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        const persona = updated[key];
        const feed = getFeed(persona.politics, persona.interactions);
        updated[key] = {
          ...persona,
          feed,
          timeline: [...persona.timeline, {
            timestamp: new Date().toLocaleTimeString(),
            politics: persona.politics,
            traits: [...persona.traits],
            interactions: { ...persona.interactions },
          }]
        };
      });
      return updated;
    });
  };

  const toggleTrait = (label, trait) => {
    setPersonas(prev => ({
      ...prev,
      [label]: {
        ...prev[label],
        traits: prev[label].traits.includes(trait)
          ? prev[label].traits.filter(t => t !== trait)
          : [...prev[label].traits, trait],
      }
    }));
  };

  const updatePolitics = (label, value) => {
    setPersonas(prev => ({
      ...prev,
      [label]: { ...prev[label], politics: parseInt(value) }
    }));
  };

  const logInteraction = (label, id, feedback) => {
    setPersonas(prev => ({
      ...prev,
      [label]: {
        ...prev[label],
        interactions: {
          ...prev[label].interactions,
          [id]: (prev[label].interactions[id] || 0) + (feedback === 'like' ? 1 : -1)
        }
      }
    }));
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', textAlign: 'center' }}>YouTube Persona Comparison Simulator</h1>
      <div style={{ textAlign: 'center', margin: '1rem 0' }}>
        <button onClick={generateFeeds}>Generate Feeds</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {['A', 'B'].map(label => (
          <div key={label} style={{ flex: '1 1 45%', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
            <h2>Persona {label}</h2>
            <label>Political Leaning: {personas[label].politics}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={personas[label].politics}
              onChange={e => updatePolitics(label, e.target.value)}
            />
            <div>
              <p>Traits:</p>
              {traits.map(trait => (
                <button key={trait} onClick={() => toggleTrait(label, trait)} style={{ margin: '0.25rem', background: personas[label].traits.includes(trait) ? '#0070f3' : '#eee', color: personas[label].traits.includes(trait) ? 'white' : 'black', padding: '0.25rem 0.5rem', border: 'none', borderRadius: '4px' }}>{trait}</button>
              ))}
            </div>
            <h3>Recommended Videos</h3>
            {personas[label].feed.map(video => (
              <div key={video.id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0' }}>
                <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${video.id}`} title={video.title} frameBorder="0" allow="autoplay"></iframe>
                <p><strong>{video.title}</strong> - {video.channel}</p>
                <p>{video.views} • {video.uploaded}</p>
                <p><em>Why: {video.reason}</em></p>
                <button onClick={() => logInteraction(label, video.id, 'like')}>Like</button>
                <button onClick={() => logInteraction(label, video.id, 'dislike')}>Dislike</button>
              </div>
            ))}
            <h3>Timeline</h3>
            <Line
              data={{
                labels: personas[label].timeline.map(e => e.timestamp),
                datasets: [
                  {
                    label: 'Politics',
                    data: personas[label].timeline.map(e => e.politics),
                    borderColor: 'blue',
                    fill: true,
                    tension: 0.3
                  },
                  {
                    label: 'Interactions',
                    data: personas[label].timeline.map(e => Object.keys(e.interactions).length),
                    borderColor: 'orange',
                    fill: true,
                    tension: 0.3
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: {
                  y: { min: 0, max: 100 },
                  x: { title: { display: true, text: 'Time' } }
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
