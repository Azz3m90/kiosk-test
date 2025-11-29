'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { WelcomeSection } from '@/components/sections/WelcomeSection';
import { DiningPreferenceSection } from '@/components/sections/DiningPreferenceSection';
import { MenuSection } from '@/components/sections/MenuSection';
import { ReviewSection } from '@/components/sections/ReviewSection';
import { PaymentSection } from '@/components/sections/PaymentSection';
import { BackToTop } from '@/components/ui/BackToTop';
import { FloatingCartButton } from '@/components/ui/FloatingCartButton';
import { SwipeNavigation } from '@/components/ui/SwipeNavigation';
import { PageIndicator } from '@/components/ui/PageIndicator';
import { useKiosk } from '@/context/KioskContext';

export default function Home() {
  const { currentStep } = useKiosk();

  // Show welcome screen without sidebar and header
  if (currentStep === 'welcome') {
    return <WelcomeSection />;
  }

  // Show dynamic dining preference/order type screen
  if (currentStep === 'orderType') {
    return <DiningPreferenceSection />;
  }

  // Show main app with sidebar and header for other steps
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar with integrated Cart */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-[320px] h-screen overflow-y-auto bg-transparent">
        {/* Header */}
        <Header />

        {/* Content Area with Swipe Navigation */}
        <SwipeNavigation>
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
            {currentStep === 'menu' && <MenuSection />}
            {currentStep === 'review' && <ReviewSection />}
            {currentStep === 'payment' && <PaymentSection />}
          </div>
        </SwipeNavigation>
      </main>

      {/* Page Indicator - Shows current page and allows quick navigation */}
      <PageIndicator />

      {/* Floating Cart Button - Always Visible (Kiosk Best Practice) */}
      <FloatingCartButton />

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
}