import React, { useState, useEffect, FormEvent } from 'react';
import { Car } from '../types';

interface CarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (carData: Omit<Car, 'id' | 'owner_id' | 'is_default'>) => Promise<void>;
  carToEdit: Car | null;
}

const CarFormModal: React.FC<CarFormModalProps> = ({ isOpen, onClose, onSubmit, carToEdit }) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [isInsured, setIsInsured] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (carToEdit) {
      setMake(carToEdit.make);
      setModel(carToEdit.model);
      setYear(carToEdit.year || '');
      setColor(carToEdit.color || '');
      setLicensePlate(carToEdit.license_plate);
      setIsInsured(carToEdit.is_insured);
    } else {
      // Reset form when adding a new car
      setMake('');
      setModel('');
      setYear(new Date().getFullYear());
      setColor('');
      setLicensePlate('');
      setIsInsured(false);
    }
  }, [carToEdit, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!make || !model || !licensePlate) {
      alert('Please fill out all required (*) fields.');
      return;
    }
    setIsProcessing(true);
    await onSubmit({ 
        make, 
        model, 
        year: year ? Number(year) : undefined, 
        color: color || undefined, 
        license_plate: licensePlate,
        is_insured: isInsured
    });
    setIsProcessing(false);
  };

  if (!isOpen) return null;
  
  const inputBaseClasses = "mt-1 block w-full px-3 py-2 text-base bg-slate-50 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg";
  const currentYear = new Date().getFullYear();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative p-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-slate-800 mb-6">{carToEdit ? 'Edit Car' : 'Add New Car'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-slate-600">Make <span className="text-red-500">*</span></label>
              <input type="text" id="make" value={make} onChange={(e) => setMake(e.target.value)} className={inputBaseClasses} placeholder="e.g., Toyota" required />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-slate-600">Model <span className="text-red-500">*</span></label>
              <input type="text" id="model" value={model} onChange={(e) => setModel(e.target.value)} className={inputBaseClasses} placeholder="e.g., Camry" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-slate-600">Year</label>
              <input type="number" id="year" value={year} onChange={(e) => setYear(e.target.value ? parseInt(e.target.value, 10) : '')} className={inputBaseClasses} min="1980" max={currentYear + 1} placeholder={String(currentYear)} />
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-slate-600">Color</label>
              <input type="text" id="color" value={color} onChange={(e) => setColor(e.target.value)} className={inputBaseClasses} placeholder="e.g., Blue" />
            </div>
          </div>
          <div>
            <label htmlFor="licensePlate" className="block text-sm font-medium text-slate-600">License Plate <span className="text-red-500">*</span></label>
            <input type="text" id="licensePlate" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value.toUpperCase())} className={inputBaseClasses} placeholder="e.g., ABC-1234" required />
          </div>
          <div className="pt-2">
            <div className="flex items-center">
                <input
                    id="isInsured"
                    name="isInsured"
                    type="checkbox"
                    checked={isInsured}
                    onChange={(e) => setIsInsured(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isInsured" className="ml-3 block text-sm font-medium text-slate-700">
                    Is this car insured?
                </label>
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isProcessing} className="px-5 py-2 text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isProcessing} className="px-5 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300">
              {isProcessing ? 'Saving...' : (carToEdit ? 'Save Changes' : 'Add Car')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarFormModal;