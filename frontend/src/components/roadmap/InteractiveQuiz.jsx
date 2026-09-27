import React, { useState } from 'react';

const InteractiveQuiz = ({ quizData, onComplete }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  if (!quizData || quizData.length === 0) return <div className="text-gray-400">No quiz available for this module.</div>;

  const handleNext = () => {
    let newScore = score;
    if (selectedOption === quizData[currentQ].answer) {
      newScore += 1;
    }
    setScore(newScore);
    
    if (currentQ + 1 < quizData.length) {
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
      const percentage = Math.round((newScore / quizData.length) * 100);
      if (onComplete) onComplete(percentage);
    }
  };

  if (showResult) {
    const percentage = Math.round((score / quizData.length) * 100);
    const passed = percentage >= 60;
    return (
      <div className="glass-card p-10 rounded-3xl text-center max-w-lg mx-auto">
        <div className="text-6xl mb-6">{passed ? '🎉' : '💪'}</div>
        <h3 className="text-2xl font-black text-white mb-2">
          {passed ? 'Great Job!' : 'Keep Practicing!'}
        </h3>
        <p className="text-gray-400 mb-6">You scored {score} out of {quizData.length} ({percentage}%)</p>
        
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-8">
          <div 
            className={`h-full rounded-full transition-all ${passed ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {passed ? (
          <p className="text-green-400 font-bold">You've successfully mastered this module's quiz!</p>
        ) : (
          <button 
            onClick={() => { setCurrentQ(0); setScore(0); setShowResult(false); setSelectedOption(null); }}
            className="btn-primary px-8 py-3 rounded-xl font-bold"
          >
            Retry Quiz
          </button>
        )}
      </div>
    );
  }

  const q = quizData[currentQ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 text-sm font-bold text-gray-500">
        <span>Question {currentQ + 1} of {quizData.length}</span>
        <span>Score: {score}</span>
      </div>
      
      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-10">
        <div 
          className="bg-primary h-full transition-all" 
          style={{ width: `${((currentQ) / quizData.length) * 100}%` }}
        />
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-white mb-8 leading-relaxed">
        {q.question}
      </h3>

      <div className="space-y-4">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelectedOption(i)}
            className={`w-full text-left p-5 rounded-2xl border transition-all ${
              selectedOption === i 
                ? 'bg-primary/20 border-primary text-white shadow-[0_0_20px_rgba(32,21,255,0.2)]' 
                : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border ${
                selectedOption === i ? 'bg-primary text-white border-primary' : 'bg-black/20 border-white/10'
              }`}>
                {String.fromCharCode(65 + i)}
              </div>
              <span className="flex-1 font-medium">{opt}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-10 flex justify-end">
        <button
          onClick={handleNext}
          disabled={selectedOption === null}
          className="btn-primary px-8 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentQ + 1 === quizData.length ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

export default InteractiveQuiz;
