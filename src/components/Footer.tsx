import { LINKS } from "@/content/bevmard";

export function Footer() {
  return (
    <footer className="border-t border-line-soft pt-10 pb-12 text-[13.5px] text-dim">
      <div className="wrap flex flex-wrap items-center justify-between gap-x-7 gap-y-3">
        <div>BMi · BEVMAQ Intelligence · BEVMAQ GmbH</div>
        <div className="flex flex-wrap gap-5">
          <a href={LINKS.buy} className="text-muted no-underline hover:text-text">
            bevmaq.com/buy
          </a>
          <a href={LINKS.contact} className="text-muted no-underline hover:text-text">
            bevmaq.com/contact
          </a>
          <a href={LINKS.home} className="text-muted no-underline hover:text-text">
            bevmaq.com
          </a>
          <a href={LINKS.linkedin} className="text-muted no-underline hover:text-text">
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
