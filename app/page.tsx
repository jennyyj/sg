export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-[#3a73c1]">SHIFT</span>
          <span className="text-[#52ace4]">GRAB</span>
        </h1>
        <p className="text-[#3a73c1] font-bold mb-8">
          CONNECTING BUSINESSES TO WORKERS INSTANTLY
        </p>
        <div className="space-y-4">
          <a href="/auth/register" className="block w-full p-4 border-2 border-[#3a73c1] text-[#3a73c1] rounded-full font-bold hover:bg-blue-50">
            REGISTER NOW ➜
          </a>
          <a href="/auth/login" className="block w-full p-4 border-2 border-[#3a73c1] text-[#3a73c1] rounded-full font-bold hover:bg-blue-50">
            LOG IN ➜
          </a>
        </div>
      </div>
    </div>
  )
}