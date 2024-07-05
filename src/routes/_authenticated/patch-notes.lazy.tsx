import { createLazyFileRoute, ErrorComponent } from '@tanstack/react-router'
import { Loading } from '@/components/Loading';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useSuspenseQuery } from '@tanstack/react-query';

export const Route = createLazyFileRoute('/_authenticated/patch-notes')({
  component: PatchNotes,
  pendingComponent: Loading,
  errorComponent: error => <ErrorComponent error={error} />
})

function PatchNotes() {
  const { data, error } = useSuspenseQuery({
    queryKey: ["APP_PATCH_NOTES"],
    queryFn: async () => {
      const response = await fetch("https://raw.githubusercontent.com/VisualSource/rusty-mc-launcher/master/PATCHNOTES.md");
      const content = await response.text();
      return content;
    }
  });
  if (error) throw error;

  return (
    <div className='w-full h-full flex flex-col bg-accent/50 overflow-y-auto scrollbar'>
      <ReactMarkdown
        className="prose prose-invert container max-w-screen-md"
        components={{
          a: ({ children, href }) => (
            <a target="_blank" rel="noopener noreferrer" href={href}>
              {children}
            </a>
          ),
        }}
        rehypePlugins={[rehypeRaw]}
      >
        {data}
      </ReactMarkdown>

    </div>
  );
}