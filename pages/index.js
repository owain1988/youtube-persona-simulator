// pages/index.js
import React, { useState, useEffect } from 'react';
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

const defaultPersona = () => ({ politics: 50, traits: [], interactions: {}, feed: [], timeline: [] });

async function fetchYouTubeVideos(query, maxResults = 5) {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
  );
  const data = await response.json();
  return data.items.map(item => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    uploaded: 'recent',
    views: 'unknown',
    reason: `Matched query: ${query}`
  }));
}

export default function Home() {
  const [personas, setPersonas] = useState({ A: defaultPersona(), B: defaultPersona() });

  useEffect(() => {
    generateFeeds();
  }, []);

  const generateFeeds = async () => {
    const getFeed = async (p, traits, interactions) => {
      let query = p < 30 ? "leftist politics" : p > 70 ? "conservative news" : "centrist news";
      if (traits.includes("Ironic")) query += " satire";
      if (traits.includes("Analytical")) query += " deep dive";
      if ((interactions['3fumBcKC6RE'] || 0) > 2) query = "anti-capitalism";
      if ((interactions['MtN1YnoL46Q'] || 0) > 2) query = "patriotism globalism";
      return await fetchYouTubeVideos(query);
    };

    const updated = { ...personas };
    for (const key of Object.keys(updated)) {
      const p = updated[key];
      const feed = await getFeed(p.politics, p.traits, p.interactions);
      updated[key] = {
        ...p,
        feed,
        timeline: [...p.timeline, {
          timestamp: new Date().toLocaleTimeString(),
          politics: p.politics,
          traits: [...p.traits],
          interactions: { ...p.interactions },
        }]
      };
    }
    setPersonas(updated);
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
        {['A', 'B'].map(label => (
          <div key={label} style={{ flex: '1 1 100%', maxWidth: '600px', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
            <h2 style={{ textAlign: 'center' }}>Persona {label}</h2>
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
                {personas[label].interactions[video.id] !== undefined && (
                  <p style={{ fontSize: '0.85rem', color: '#4caf50' }}>Interactions: {personas[label].interactions[video.id]}</p>
                )}
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
