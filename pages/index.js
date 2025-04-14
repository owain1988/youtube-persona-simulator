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
    description: item.snippet.description.split(/\n|\./)[0],
    
  }));
}

export default function Home() {
  const [personas, setPersonas] = useState({ A: defaultPersona(), B: defaultPersona() });

  const generateFeeds = async () => {
    const getFeed = async (p, traits, interactions) => {
      const queries = [];

      // Political leaning base queries
      if (p < 30) queries.push("leftist politics", "progressive commentary");
      else if (p > 70) queries.push("conservative news", "right wing media");
      else queries.push("centrist politics", "independent analysis");

      // Trait-based influence
      if (traits.includes("Curious")) queries.push("documentary", "educational exploration");
      if (traits.includes("Ironic")) queries.push("satire", "edgy humor");
      if (traits.includes("Analytical")) queries.push("longform analysis", "explainer videos");
      if (traits.includes("Tribalist")) queries.push("culture war debate", "reaction content");
      if (traits.includes("Anger-prone")) queries.push("rant", "controversial outrage");

      // Use recent interaction influence
      const topInteracted = Object.entries(interactions)
        .filter(([_, count]) => count > 1)
        .map(([id]) => id);

      if (topInteracted.length > 0) {
        queries.push("follow up to " + topInteracted.slice(0, 2).join(" "));
      }

      // Fetch multiple feeds and merge
      const results = await Promise.all(
        queries.slice(0, 4).map(q => fetchYouTubeVideos(q, 3))
      );
      const merged = results.flat();

      // Shuffle
      for (let i = merged.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [merged[i], merged[j]] = [merged[j], merged[i]];
      }

      return merged.slice(0, 6);
    };
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

  useEffect(() => {
    generateFeeds();
  }, []);

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
      <p style={{ maxWidth: '750px', margin: '1rem auto', textAlign: 'center' }}>
        We all live in echo chambers these days whether we like it or not! But, seeing how others navigate YouTube can be incredibly useful in shaping understanding the plethora of world views that exist in todays complex and globally connected world. <br />
        Set political leanings and personality traits for each persona, then hit “Generate Feeds” to see their personalised YouTube recommendations side by side.
      </p>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <button onClick={generateFeeds} style={{ padding: '0.75rem 1.25rem', fontSize: '1rem', fontWeight: 'bold', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Generate Feeds</button>
      </div>
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
                <p><em>{video.description}</em></p>
                
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
