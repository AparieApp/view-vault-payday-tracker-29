
import React from 'react';
import { Platform } from '@/types';
import { cn } from '@/lib/utils';
import {
  Youtube,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  MessageCircle,
  Cloud,
  Pin
} from 'lucide-react';

interface PlatformIconProps {
  platform: Platform;
  className?: string;
  size?: number;
}

const PlatformIcon: React.FC<PlatformIconProps> = ({ platform, className, size = 16 }) => {
  const getIcon = () => {
    switch (platform) {
      case 'tiktok':
        return (
          <div className={cn("platform-icon bg-platform-tiktok", className)}>
            <span className="text-xs font-bold">TT</span>
          </div>
        );
      case 'youtube':
        return (
          <div className={cn("platform-icon bg-platform-youtube", className)}>
            <Youtube size={size} />
          </div>
        );
      case 'instagram':
        return (
          <div className={cn("platform-icon bg-platform-instagram", className)}>
            <Instagram size={size} />
          </div>
        );
      case 'twitter':
        return (
          <div className={cn("platform-icon bg-platform-twitter", className)}>
            <Twitter size={size} />
          </div>
        );
      case 'linkedin':
        return (
          <div className={cn("platform-icon bg-platform-linkedin", className)}>
            <Linkedin size={size} />
          </div>
        );
      case 'threads':
        return (
          <div className={cn("platform-icon bg-platform-threads", className)}>
            <MessageCircle size={size} />
          </div>
        );
      case 'facebook':
        return (
          <div className={cn("platform-icon bg-platform-facebook", className)}>
            <Facebook size={size} />
          </div>
        );
      case 'bluesky':
        return (
          <div className={cn("platform-icon bg-platform-bluesky", className)}>
            <Cloud size={size} />
          </div>
        );
      case 'pinterest':
        return (
          <div className={cn("platform-icon bg-platform-pinterest", className)}>
            <Pin size={size} />
          </div>
        );
      default:
        return null;
    }
  };

  return getIcon();
};

export default PlatformIcon;
