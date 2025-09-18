/**
 * 낙관적 업데이트를 위한 기본 인터페이스
 * 모든 낙관적 업데이트 대상 데이터 타입이 확장해야 함
 */
export interface OptimisticItem {
  id: any;
  isTemp?: boolean;     // 임시 상태 (아직 DB에 저장되지 않음)
  isPending?: boolean;  // DB 저장 진행 중
}