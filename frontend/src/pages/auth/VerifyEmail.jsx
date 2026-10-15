import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { authService } from '../../services/auth.service.js';
import { getErrorMessage } from '../../services/api.js';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setStatus('error');
      setMessage('Lien de verification invalide.');
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(getErrorMessage(err));
      });
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <div className="card space-y-3 p-6 text-center">
        {status === 'loading' && (
          <>
            <h1 className="text-xl font-bold">Verification en cours...</h1>
            <p className="text-sm text-celebra-dark/70">
              Merci de patienter pendant la confirmation de votre adresse email.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={44} className="mx-auto text-green-600" />
            <h1 className="text-xl font-bold">Email confirme</h1>
            <p className="text-sm text-celebra-dark/70">
              Votre adresse email a bien ete verifiee. Vous pouvez desormais vous connecter.
            </p>
            <Link to="/connexion" className="btn-primary w-full">
              Se connecter
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={44} className="mx-auto text-red-500" />
            <h1 className="text-xl font-bold">Verification impossible</h1>
            <p className="text-sm text-celebra-dark/70">
              {message || 'Le lien est invalide ou expire.'}
            </p>
            <Link to="/connexion" className="btn-primary w-full">
              Retour a la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
