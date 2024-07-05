import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/bug-report')({
  component: () => <div>Hello /_authenticated/bug-report!</div>
})