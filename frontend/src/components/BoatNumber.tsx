interface BoatNumberProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export default function BoatNumber({ number, size = 'md', className = '' }: BoatNumberProps) {
  const bgClasses = [
    '',
    'bg-white text-black',
    'bg-black text-white border border-gray-500',
    'bg-red-600 text-white',
    'bg-blue-600 text-white',
    'bg-yellow-500 text-black',
    'bg-green-600 text-white',
  ];

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${bgClasses[number] || ''} 
        rounded-full flex items-center justify-center font-bold
        ${className}
      `}
    >
      {number}
    </div>
  );
}
