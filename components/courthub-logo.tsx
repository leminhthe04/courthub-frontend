import Image from 'next/image';

type CourtHubLogoProps = {
  className?: string;
};

export function CourtHubLogo({ className = 'h-9 w-9' }: CourtHubLogoProps) {
  return <Image src="/icon.svg" alt="CourtHub logo" className={className} width={36} height={36} />;
}
