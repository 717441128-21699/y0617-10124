
import { getInitials, generateAvatarColor, cn } from '@/utils/format';

interface Props {
  name: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES: Record<NonNullable<Props['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

export function Avatar({ name, avatar, size = 'md', className }: Props) {
  const colorClass = generateAvatarColor(name);
  const initials = getInitials(name);

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn('rounded-full object-cover flex-shrink-0', SIZES[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        colorClass,
        SIZES[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
