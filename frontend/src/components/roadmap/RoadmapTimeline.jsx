import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import RoadmapNode from './RoadmapNode';

const RoadmapTimeline = ({ steps, onTaskToggle }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children, 
        { opacity: 0, x: -30 }, 
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [steps]);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="relative pl-4 md:pl-8 py-4" ref={containerRef}>
      {/* Vertical Line */}
      <div className="absolute top-0 bottom-0 left-[27px] md:left-[43px] w-0.5 bg-white/10" />
      
      {steps.map((step, index) => (
        <RoadmapNode 
          key={step.id || index} 
          step={step} 
          index={index} 
          isLast={index === steps.length - 1}
          onTaskToggle={onTaskToggle}
        />
      ))}
    </div>
  );
};

export default RoadmapTimeline;
