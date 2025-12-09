import { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type Props = {
    params: Promise<{ token: string }>;
    children: React.ReactNode;
};

// Generate dynamic metadata for Open Graph previews
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { token } = await params;
    
    // Validate token format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
        return {
            title: 'Link Inválido | Trading Journal Pro',
            description: 'Este link de compartilhamento é inválido.',
        };
    }

    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                },
            }
        );

        // Get shared journal data
        const { data: sharedData } = await supabase
            .from('shared_journals')
            .select('journal_entry_id, expires_at, user_id')
            .eq('share_token', token)
            .single();

        if (!sharedData) {
            return {
                title: 'Link Inválido | Trading Journal Pro',
                description: 'Este link de compartilhamento não foi encontrado ou expirou.',
            };
        }

        // Check expiration
        if (new Date(sharedData.expires_at) < new Date()) {
            return {
                title: 'Link Expirado | Trading Journal Pro',
                description: 'Este link de compartilhamento expirou.',
            };
        }

        // Get journal entry
        const { data: entry } = await supabase
            .from('journal_entries')
            .select('title, date, asset')
            .eq('id', sharedData.journal_entry_id)
            .single();

        // Get user info who shared
        const { data: userData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', sharedData.user_id)
            .single();

        // Get first image for OG preview
        const { data: images } = await supabase
            .from('journal_images')
            .select('url')
            .eq('journal_entry_id', sharedData.journal_entry_id)
            .order('display_order', { ascending: true })
            .limit(1);

        const userName = userData?.name || userData?.email?.split('@')[0] || 'Trader';
        const assetInfo = entry?.asset ? ` | ${entry.asset}` : '';
        const dateFormatted = entry?.date 
            ? new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '';

        const title = `📊 Diário de ${userName}${assetInfo} - ${dateFormatted}`;
        const description = entry?.title || `${userName} compartilhou uma análise de trading com você.`;
        const ogImage = images?.[0]?.url || undefined;

        return {
            title: `${title} | Trading Journal Pro`,
            description,
            openGraph: {
                title,
                description,
                type: 'article',
                siteName: 'Trading Journal Pro',
                images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: 'Análise de Trading' }] : [],
            },
            twitter: {
                card: ogImage ? 'summary_large_image' : 'summary',
                title,
                description,
                images: ogImage ? [ogImage] : [],
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Diário Compartilhado | Trading Journal Pro',
            description: 'Visualize esta análise de trading compartilhada.',
        };
    }
}

export default function ShareLayout({ children }: Props) {
    return <>{children}</>;
}
