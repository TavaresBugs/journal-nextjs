import { EconomicCalendar } from './EconomicCalendar'
import { Card, CardContent } from '@/components/ui'

/**
 * Dashboard News tab wrapper component.
 * Wraps the EconomicCalendar in Card without title header.
 */
export function DashboardNews() {
  return (
    <Card>
      <CardContent className="pt-4">
        <EconomicCalendar />
      </CardContent>
    </Card>
  )
}
