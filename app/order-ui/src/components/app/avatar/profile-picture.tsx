import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Pencil } from 'lucide-react'

interface ProfilePictureProps {
  height: number
  width: number
  src: string
  // onUpload: (file: File) => void
}

export default function ProfilePicture({
  height,
  width,
  src,
  // onUpload,
}: ProfilePictureProps) {
  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0]
  //   if (file) {
  //     onUpload(file)
  //   }
  // }

  return (
    <div className="relative" style={{ height, width }}>
      <Avatar
        style={{ height, width }}
        className="group relative overflow-hidden border"
      >
        <AvatarImage
          className="cursor-pointer rounded-full transition-all duration-300 ease-in-out group-hover:brightness-75"
          src={src}
          alt="Profile Picture"
          height={height}
          width={width}
        />
      </Avatar>

      <label
        htmlFor="profile-picture-upload"
        className="absolute bottom-0 right-1 cursor-pointer rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1"
      >
        <Pencil size={16} className="text-white" />
      </label>
      <input
        id="profile-picture-upload"
        type="file"
        accept="image/*"
        // onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
