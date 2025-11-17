import React from 'react';

const EnvelopeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const Footer: React.FC = () => {
    return (
        <footer className="mt-16 py-8 bg-white border-t border-slate-200 rounded-t-2xl">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-800">Feedback and Questions</h2>
                <p className="mt-2 text-slate-600 max-w-lg mx-auto">
                    We're always looking to improve! If you have any feedback, questions, or encounter any issues, please don't hesitate to reach out.
                </p>
                <div className="mt-6">
                    <a 
                        href="mailto:yc2857@cornell.edu"
                        className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <EnvelopeIcon />
                        Contact Support
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;