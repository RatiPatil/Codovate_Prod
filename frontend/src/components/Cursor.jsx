import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function Cursor() {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Check if device supports hover
    if (window.matchMedia('(hover: none)').matches) {
      return;
    }

    const onMouseMove = (e) => {
      if (!isVisible) setIsVisible(true);
      
      // Move main dot instantly
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0,
      });

      // Move follower with lag
      gsap.to(followerRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.6,
        ease: 'power3.out',
      });
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);
    
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    // Add event listeners for interactive elements
    const handleMouseOver = (e) => {
      if (
        e.target.tagName.toLowerCase() === 'button' ||
        e.target.tagName.toLowerCase() === 'a' ||
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.tagName.toLowerCase() === 'input'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Small dot */}
      <div
        ref={cursorRef}
        className={`fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference transition-transform duration-100 ${
          isClicking ? 'scale-50' : 'scale-100'
        }`}
      />
      {/* Glowing follower */}
      <div
        ref={followerRef}
        className={`fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 border border-primary rounded-full pointer-events-none z-[9998] transition-all duration-300 ease-out flex items-center justify-center ${
          isHovering ? 'scale-150 bg-primary/20 border-primary/50' : 'scale-100 bg-transparent'
        } ${isClicking ? 'scale-75 bg-primary/40' : ''}`}
        style={{
          boxShadow: isHovering ? '0 0 20px rgba(32,21,255,0.4)' : 'none'
        }}
      />
    </>
  );
}
