import { Link } from 'react-router'

export function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-4xl font-bold text-gray-900">404</h2>
      <p className="mt-2 text-gray-600">Page not found</p>
      <Link to="/" className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500">
        Back to Dashboard
      </Link>
    </div>
  )
}
