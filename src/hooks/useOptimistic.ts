import { toast } from "@/hooks/useToast";
import type { OptimisticItem } from "@/lib/types";

interface OptimisticCreateOptions<T> {
  onAdd: (item: T) => void;
  onRemove: (id: string) => void;
  onUpdate?: (item: T) => void;
}

/**
 * 낙관적 업데이트 패턴을 캡슐화한 커스텀 훅
 * @param createFn DB 생성 함수
 * @param options 추가/제거/업데이트 콜백 함수들
 */
export function useOptimistic<T extends OptimisticItem, CreateArgs extends any[]>(
  createFn: (...args: CreateArgs) => Promise<{data: any, error: any}>,
  { onAdd, onRemove, onUpdate }: OptimisticCreateOptions<T>
) {

  /**
   * 낙관적 업데이트 실행
   * @param optimisticItem 즉시 UI에 추가할 아이템
   * @param createArgs DB 생성 함수에 전달할 인자들
   * @param errorMessage 실패 시 표시할 에러 메시지
   */
  const execute = async (
    optimisticItem: T,
    createArgs: CreateArgs,
    errorMessage: string
  ) => {
    // 1. 임시 상태로 즉시 UI 업데이트
    const tempItem = {
      ...optimisticItem,
      isTemp: true,
      isPending: false
    } as T;

    console.log('🚀 [낙관적 업데이트] 즉시 UI 추가:', {
      id: tempItem.id,
      text: (tempItem as any).text,
      type: (tempItem as any).type,
      isTemp: tempItem.isTemp,
      isPending: tempItem.isPending
    });

    onAdd(tempItem);

    // 2. DB 저장 시작 (pending 상태로 변경)
    if (onUpdate) {
      console.log('⏳ [상태 변경] DB 저장 시작 - pending 상태로 변경:', tempItem.id);
      onUpdate({
        ...tempItem,
        isPending: true
      } as T);
    }

    // 3. 백그라운드 DB 저장
    console.log('📤 [DB 요청] 백그라운드 저장 시작:', createArgs);

    try {
      const { data, error } = await createFn(...createArgs);

      if (error) throw error;

      console.log('✅ [DB 응답] 저장 성공:', {
        tempId: tempItem.id,
        realId: data.id,
        data: data
      });

      // 4. 성공 시: 실제 ID로 교체 및 상태 플래그 제거
      onRemove(tempItem.id);
      const finalItem = {
        ...tempItem,
        id: data.id,
        isTemp: false,
        isPending: false
      } as T;

      console.log('🔄 [ID 교체] 임시 ID → 실제 ID:', {
        before: tempItem.id,
        after: data.id,
        isTemp: false,
        isPending: false
      });

      onAdd(finalItem);

    } catch (error) {
      // 5. 실패 시: 롤백 + 에러 토스트
      console.log('❌ [DB 응답] 저장 실패 - 롤백 실행:', {
        tempId: tempItem.id,
        error: error
      });

      onRemove(tempItem.id);
      console.error("생성 실패:", error);
      toast.error(errorMessage);
    }
  };

  return { execute };
}