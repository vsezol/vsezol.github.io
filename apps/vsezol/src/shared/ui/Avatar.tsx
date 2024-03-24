import Image from 'next/image';

export interface AvatarProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export const Avatar = ({ src, alt, priority = false }: AvatarProps) => {
  return (
    <div className="avatar">
      <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
        <figure>
          <Image
            src={src}
            alt={alt}
            priority={priority ?? false}
            width={96}
            height={96}
          />
        </figure>
      </div>
    </div>
  );
};
