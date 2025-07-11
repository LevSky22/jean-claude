export default function PrivacyFooter() {
  return (
    <footer className="py-2 px-4 text-center">
      <p className="text-xs text-gray-500 max-w-[720px] mx-auto">
        All your data is saved locally in your browser. 
        The site owner has no access to your conversations. 
        The privacy policies of{' '}
        <a 
          href="https://mistral.ai/terms/#privacy-policy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#0055A4] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0055A4] focus:ring-offset-1 rounded"
          aria-label="Mistral AI privacy policy (opens in new tab)"
        >
          Mistral AI
        </a>
        {' '}and{' '}
        <a 
          href="https://www.cloudflare.com/privacypolicy/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#0055A4] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0055A4] focus:ring-offset-1 rounded"
          aria-label="Cloudflare privacy policy (opens in new tab)"
        >
          Cloudflare
        </a>
        {' '}apply.
      </p>
    </footer>
  )
}