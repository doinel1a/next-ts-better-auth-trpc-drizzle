import Link from 'next/link';

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className='border-border flex h-10 w-full items-center justify-center border-t text-sm'>
      by &nbsp;
      <Link href='https://business-link.d1a.app' className='text-primary'>
        doinel1a
      </Link>
      &nbsp; {year}
    </footer>
  );
}
