const VerificationPage = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputs = useRef([]);
    const navigate = useNavigate();
  
    const handleChange = (element, index) => {
      if (isNaN(element.value)) return false;
  
      setCode([...code.map((d, idx) => (idx === index ? element.value : d))]);
  
      // Focus next input
      if (element.value) {
        if (index < 5) {
          inputs.current[index + 1].focus();
        }
      }
    };
  
    const handleSubmit = async () => {
      const verificationCode = code.join('');
      const userId = localStorage.getItem('userId');
  
      setLoading(true);
      setError('');
  
      try {
        const response = await fetch('/api/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: verificationCode,
            userId
          })
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.error || 'Verification failed');
        }
  
        // Clear verification storage
        localStorage.removeItem('requiresVerification');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
  
        // Navigate to app
        navigate('/app');
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Enter Verification Code
          </h2>
          
          <div className="flex justify-center space-x-4 mb-8">
            {code.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength="1"
                value={digit}
                ref={el => inputs.current[idx] = el}
                onChange={e => handleChange(e.target, idx)}
                className="w-12 h-12 text-center text-2xl font-bold bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            ))}
          </div>
  
          {error && (
            <p className="text-red-500 text-center mb-4">{error}</p>
          )}
  
          <button
            onClick={handleSubmit}
            disabled={loading || code.some(d => !d)}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </div>
      </div>
    );
  };