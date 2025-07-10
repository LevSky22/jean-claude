interface SkipNavProps {
  targetId: string
  children: React.ReactNode
}

export default function SkipNav({ targetId, children }: SkipNavProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0055A4] focus:text-white focus:rounded-md focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0055A4]"
    >
      {children}
    </a>
  )
}