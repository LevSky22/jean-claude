export default function PrivacyFooter() {
  return (
    <footer className="py-2 px-4 text-center">
      <p className="text-xs text-gray-500 max-w-[720px] mx-auto">
        Toutes vos données sont sauvegardées localement dans votre navigateur. 
        Le propriétaire du site n'a aucun accès à vos conversations. 
        Les politiques de confidentialité de{' '}
        <a 
          href="https://mistral.ai/terms/#privacy-policy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#0055A4] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0055A4] focus:ring-offset-1 rounded"
          aria-label="Politique de confidentialité de Mistral AI (ouvre dans un nouvel onglet)"
        >
          Mistral AI
        </a>
        {' '}et{' '}
        <a 
          href="https://www.cloudflare.com/privacypolicy/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#0055A4] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0055A4] focus:ring-offset-1 rounded"
          aria-label="Politique de confidentialité de Cloudflare (ouvre dans un nouvel onglet)"
        >
          Cloudflare
        </a>
        {' '}s'appliquent.
      </p>
    </footer>
  )
}