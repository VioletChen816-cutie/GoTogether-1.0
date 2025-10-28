import React, { useState } from 'react';
import { UserToRate } from '../types';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
  userToRate: UserToRate;
}

const StarIcon: React.FC<{ isFilled: boolean, onMouseEnter: () => void, onClick: () => void }> = ({ isFilled, onMouseEnter, onClick }) => (
  <button type="button" onMouseEnter={onMouseEnter} onClick={onClick} className="focus:outline-none">
    <svg className={`w-8 h-8 cursor-pointer transition-colors duration-200 ${isFilled ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-200'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
    </svg>
  </button>
);

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSubmit, userToRate }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }
    setIsProcessing(true);
    await onSubmit(rating, comment);
    setIsProcessing(false);
  };
  
  const handleClose = () => {
    if (isProcessing) return;
    setRating(0);
    setHoverRating(0);
    setComment('');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative p-8 transform transition-all text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={userToRate.avatar_url || `https://picsum.photos/seed/${userToRate.id}/100/100`}
          alt={userToRate.name}
          className="h-20 w-20 rounded-full object-cover mx-auto mb-4 border-4 border-slate-100"
        />
        <h3 className="text-lg font-semibold text-slate-800">How was your ride with <br/> {userToRate.name}?</h3>
        
        <div className="my-5 flex justify-center space-x-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map(star => (
            <StarIcon
              key={star}
              isFilled={star <= (hoverRating || rating)}
              onMouseEnter={() => setHoverRating(star)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What went well? (Optional, private)"
          className="mt-1 block w-full px-3 py-2 text-base bg-slate-50 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
          rows={3}
        />
        
        <div className="mt-6 flex flex-col space-y-3">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || rating === 0}
            className="w-full px-6 py-2.5 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Submitting...' : 'Submit Rating'}
          </button>
           <button
            onClick={handleClose}
            disabled={isProcessing}
            className="w-full px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
