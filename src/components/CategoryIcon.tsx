import React from 'react';
import {
  Utensils,
  Home,
  Zap,
  HeartPulse,
  ShoppingBag,
  Car,
  Briefcase,
  Laptop,
  TrendingUp,
  Wallet,
  Smartphone,
  Building2,
  DollarSign,
  Coffee,
  Film,
  Book,
  GraduationCap,
  Plane,
  Gift,
  Tag,
  CircleDollarSign,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  switch (name?.toLowerCase()) {
    case 'utensils':
    case 'food':
    case 'dining':
      return <Utensils {...props} />;
    case 'home':
    case 'rent':
    case 'house':
      return <Home {...props} />;
    case 'zap':
    case 'bills':
    case 'utilities':
      return <Zap {...props} />;
    case 'heartpulse':
    case 'medical':
    case 'health':
      return <HeartPulse {...props} />;
    case 'shoppingbag':
    case 'shopping':
    case 'groceries':
      return <ShoppingBag {...props} />;
    case 'car':
    case 'transport':
    case 'commute':
      return <Car {...props} />;
    case 'briefcase':
    case 'salary':
    case 'job':
      return <Briefcase {...props} />;
    case 'laptop':
    case 'casual':
    case 'freelance':
      return <Laptop {...props} />;
    case 'trendingup':
    case 'investments':
    case 'profit':
      return <TrendingUp {...props} />;
    case 'wallet':
    case 'cash':
      return <Wallet {...props} />;
    case 'smartphone':
    case 'bkash':
    case 'nagad':
    case 'mobile':
      return <Smartphone {...props} />;
    case 'building2':
    case 'bank':
      return <Building2 {...props} />;
    case 'coffee':
      return <Coffee {...props} />;
    case 'film':
    case 'entertainment':
      return <Film {...props} />;
    case 'book':
    case 'education':
    case 'graduationcap':
      return <GraduationCap {...props} />;
    case 'plane':
    case 'travel':
      return <Plane {...props} />;
    case 'gift':
      return <Gift {...props} />;
    default:
      return <Tag {...props} />;
  }
};
