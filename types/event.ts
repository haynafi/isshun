export interface Event {
  id: number
  title: string
  place: string
  gradient: string
  icon: string
  date: string
  time: string
  status?: 'pending' | 'accepted' | 'declined'
  qr_code_path?: string | null
  photo_path?: string | null
}

export interface ApiError {
  error: string
  details?: string
}

