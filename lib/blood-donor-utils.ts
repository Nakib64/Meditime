export function formatAvailabilityStatus(status: string, language: 'en' | 'bn'): string {
  if (status === 'Available') {
    return language === 'bn' ? 'উপলব্ধ' : 'Available';
  }
  if (status === 'Unavailable') {
    return language === 'bn' ? 'অনুপলব্ধ' : 'Unavailable';
  }
  if (status === 'Recently Donated') {
    return language === 'bn' ? 'সম্প্রতি দিয়েছেন' : 'Recently Donated';
  }
  return status;
}

export function formatLastDonation(lastDonation: any, language: 'en' | 'bn'): string {
  if (!lastDonation) {
    return language === 'bn' ? 'কখনো নয়' : 'Never';
  }

  const strVal = String(lastDonation).trim();

  if (strVal === 'Never' || strVal === 'কখনো নয়') {
    return language === 'bn' ? 'কখনো নয়' : 'Never';
  }
  if (strVal === 'Within 3 months' || strVal === '৩ মাসের মধ্যে') {
    return language === 'bn' ? '৩ মাসের মধ্যে' : 'Within 3 months';
  }
  if (strVal === 'Over 3 months ago' || strVal === '৩ মাসের বেশি আগে') {
    return language === 'bn' ? '৩ মাসের বেশি আগে' : 'Over 3 months ago';
  }

  // If Date object or ISO date string
  const dateObj = new Date(lastDonation);
  if (!isNaN(dateObj.getTime())) {
    const diffMs = Date.now() - dateObj.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays <= 90) {
      return language === 'bn' ? '৩ মাসের মধ্যে' : 'Within 3 months';
    } else {
      return language === 'bn' ? '৩ মাসের বেশি আগে' : 'Over 3 months ago';
    }
  }

  return language === 'bn' ? 'কখনো নয়' : 'Never';
}
