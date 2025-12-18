'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAccountStore } from '@/store/useAccountStore';

interface BackButtonProps {
    label?: string;
    className?: string;
}

export function BackButton({ label = 'Voltar ao Dashboard', className }: BackButtonProps) {
    const router = useRouter();
    const { currentAccountId } = useAccountStore();
    
    const goBack = () => {
        if (currentAccountId) {
            router.push(`/dashboard/${currentAccountId}`);
        } else {
            router.push('/');
        }
    };
    
    return (
        <Button 
            variant="ghost" 
            onClick={goBack} 
            className={className}
            leftIcon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            }
        >
            {label}
        </Button>
    );
}
