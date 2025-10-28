import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServiceModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const appName = "GoTogether";
  const effectiveDate = "October 26, 2023";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Terms of Service</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-slate-700 space-y-4 text-sm">
            <p className="text-xs text-slate-500">Effective Date: {effectiveDate}<br/>Last Updated: {effectiveDate}</p>
            
            <p>Welcome to {appName} (“we,” “our,” or “us”). {appName} is a ridesharing platform that connects verified university community members (“Users”) to share rides within and around campus.</p>
            <p>By downloading, accessing, or using our app or website, you agree to these Terms of Service (“Terms”). Please read them carefully before using the service.</p>

            <h3 className="text-md font-semibold text-slate-800 pt-2">1. Nature of Service</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{appName} provides a digital platform that allows Users to communicate, coordinate, and share rides.</li>
                <li>We do not provide transportation services and are not a transportation carrier.</li>
                <li>All rides are arranged directly between Users, and Users are solely responsible for their conduct and compliance with applicable laws.</li>
            </ul>

            <h3 className="text-md font-semibold text-slate-800 pt-2">2. Eligibility</h3>
            <p>You must:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Be at least 18 years old;</li>
                <li>Have a valid university email address or verified school login;</li>
                <li>Maintain a valid driver’s license and insurance (if driving);</li>
                <li>Agree to comply with all campus safety and transportation regulations.</li>
            </ul>

            <h3 className="text-md font-semibold text-slate-800 pt-2">3. User Responsibilities</h3>
            <p>Users understand and agree that:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li>You assume all risks related to using the service, including travel with other Users.</li>
                <li>You are responsible for your own personal safety and decision to accept or provide a ride.</li>
                <li>You will not use the app for unlawful, commercial, or unsafe purposes.</li>
            </ul>
            
            <h3 className="text-md font-semibold text-slate-800 pt-2">4. No Liability</h3>
            <p>{appName}, its founders, employees, and affiliates are not responsible or liable for:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Any accident, injury, property damage, or loss arising from your use of the service;</li>
                <li>The actions, behavior, or conduct of any User;</li>
                <li>Any technical or connectivity issues related to the app.</li>
            </ul>
            <p>By using this service, you waive and release {appName} from any and all claims, demands, or damages related to your use of the platform.</p>

            <h3 className="text-md font-semibold text-slate-800 pt-2">5. Insurance &amp; Verification</h3>
            <p>Drivers are responsible for maintaining valid auto insurance and compliance with applicable laws. {appName} does not verify insurance coverage and is not liable for any lack of coverage.</p>

            <h3 className="text-md font-semibold text-slate-800 pt-2">6. Community Standards</h3>
            <p>Users agree to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Respect all community members;</li>
                <li>Avoid harassment, discrimination, or unsafe behavior;</li>
                <li>Use accurate profile information.</li>
            </ul>
            <p>We reserve the right to suspend or terminate any account for violation of these Terms or misuse of the platform.</p>

            <h3 className="text-md font-semibold text-slate-800 pt-2">7. Privacy</h3>
            <p>Your information (including name, contact, and trip details) is used in accordance with our Privacy Policy, which explains how data is collected, stored, and shared.</p>

            <h3 className="text-md font-semibold text-slate-800 pt-2">8. Dispute Resolution</h3>
            <p>Any disputes will be resolved through binding arbitration under the laws of New York, rather than in court.</p>

            <h3 className="text-md font-semibold text-slate-800 pt-2">9. Limitation of Liability</h3>
            <p>To the maximum extent permitted by law, {appName} and its affiliates shall not be liable for indirect, incidental, consequential, or punitive damages, including but not limited to loss of data, injury, or emotional distress.</p>

            <h3 className="text-md font-semibold text-slate-800 pt-2">10. Changes to Terms</h3>
            <p>We may update these Terms periodically. Continued use of the platform after any changes constitutes your acceptance of the revised Terms.</p>

            <h3 className="text-md font-semibold text-slate-800 pt-2">11. Contact Us</h3>
            <p>If you have questions about these Terms, please contact:</p>
            <p>
                📧 support@gotogether.app<br/>
                🏢 GoTogether Inc., 123 Innovation Drive, Ithaca, NY
            </p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right flex-shrink-0">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;