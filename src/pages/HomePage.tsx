import { useEffect } from "react"
import { useAuthStore } from "@/store/AuthStore"
import { useFeedStore } from "@/store/FeedStore"
import { Loader2 } from "lucide-react"

export function HomePage() {
  const { basicInfo } = useAuthStore()
  const { posts, isLoading, fetchProfilePosts } = useFeedStore()

  useEffect(() => {
    if (basicInfo) {
      fetchProfilePosts(basicInfo.id)
    }
  }, [basicInfo, fetchProfilePosts])

  if (!basicInfo) {
    return null
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">
            Welcome, {basicInfo.firstName} {basicInfo.lastName}
          </h1>

          <div className="mb-4">
            <p className="text-gray-600">
              Role: {basicInfo.role === 1 ? "Seeker" : basicInfo.role === 2 ? "Personal Trainer" : "Admin"}
            </p>
          </div>

          {/* Posts Section */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Your Posts</h2>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-[#de9151]" />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-500">
                <p>No posts to show yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <img
                        src={basicInfo.avatar || `https://ui-avatars.com/api/?name=${basicInfo.firstName}+${basicInfo.lastName}&background=de9151&color=fff`}
                        alt="Profile"
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{basicInfo.firstName} {basicInfo.lastName}</span>
                          <span className="text-sm text-gray-500">@{basicInfo.username}</span>
                        </div>
                        <p className="mt-1 text-gray-800">{post.content}</p>
                        {post.medias && post.medias.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {post.medias.map((media, index) => (
                              <img
                                key={index}
                                src={media}
                                alt={`Post media ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1">
                            <span>{post.likeCount} likes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
