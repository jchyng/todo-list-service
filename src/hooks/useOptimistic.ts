import { toast } from "@/hooks/useToast";
import type { OptimisticItem } from "@/lib/types";

interface OptimisticOptions<T> {
  onAdd: (item: T) => void;
  onRemove: (id: string) => void;
  onUpdate?: (item: T) => void;
}

interface ExecuteOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

type AsyncFunction<Args extends any[], Result> = (
  ...args: Args
) => Promise<{ data: Result; error: any }>;

/**
 * 낙관적 업데이트를 처리하는 커스텀 훅
 *
 * @template T - OptimisticItem을 확장한 타입
 * @template Args - 생성 함수의 인자 타입
 * @template Result - 생성 함수의 반환 타입
 *
 * @param createFn - 서버에 데이터를 생성하는 비동기 함수
 * @param options - UI 업데이트를 위한 콜백 함수들
 */
export function useOptimistic<
  T extends OptimisticItem,
  Args extends any[] = any[],
  Result = any
>(
  createFn: AsyncFunction<Args, Result>,
  { onAdd, onRemove, onUpdate }: OptimisticOptions<T>
) {
  /**
   * 낙관적 업데이트를 실행합니다
   *
   * @param optimisticItem - UI에 즉시 표시할 임시 아이템
   * @param createArgs - 서버 요청에 사용할 인자들
   * @param errorMessage - 실패 시 표시할 에러 메시지
   * @param options - 추가 옵션 (성공/실패 콜백)
   */
  const execute = async (
    optimisticItem: T,
    createArgs: Args,
    errorMessage: string,
    options?: ExecuteOptions
  ): Promise<void> => {
    // 1️⃣ 즉시 UI 업데이트 (임시 아이템 추가)
    const tempItem: T = {
      ...optimisticItem,
      isTemp: true,
      isPending: false,
    };

    onAdd(tempItem);
    logStep("UI_ADD", tempItem);

    // 2️⃣ Pending 상태로 전환
    if (onUpdate) {
      const pendingItem: T = { ...tempItem, isPending: true };
      onUpdate(pendingItem);
      logStep("PENDING", pendingItem);
    }

    try {
      // 3️⃣ 서버에 데이터 생성 요청
      logStep("SERVER_REQUEST", createArgs);
      const { data, error } = await createFn(...createArgs);

      if (error) {
        throw error;
      }

      // 4️⃣ 성공: 실제 데이터로 교체
      const finalItem: T = {
        ...tempItem,
        ...(data as any),
        id: (data as any).id,
        isTemp: false,
        isPending: false,
      };

      onRemove(tempItem.id);
      onAdd(finalItem);

      logStep("SUCCESS", { tempId: tempItem.id, realId: finalItem.id });
      options?.onSuccess?.();
    } catch (error) {
      // 5️⃣ 실패: 롤백 처리
      onRemove(tempItem.id);

      logStep("ROLLBACK", { tempId: tempItem.id, error });
      console.error("Creation failed:", error);

      toast.error(errorMessage);
      options?.onError?.(error);
    }
  };

  return { execute };
}

// 디버깅용 로거 (개발 환경에서만 활성화)
function logStep(step: string, data: any) {
  if (process.env.NODE_ENV !== "development") return;

  const emojis = {
    UI_ADD: "🚀",
    PENDING: "⏳",
    SERVER_REQUEST: "📤",
    SUCCESS: "✅",
    ROLLBACK: "❌",
  };

  const messages = {
    UI_ADD: "UI 즉시 업데이트",
    PENDING: "서버 요청 중",
    SERVER_REQUEST: "서버 요청 시작",
    SUCCESS: "저장 완료",
    ROLLBACK: "롤백 실행",
  };

  console.log(
    `${emojis[step as keyof typeof emojis] || "📌"} [${
      messages[step as keyof typeof messages] || step
    }]`,
    data
  );
}
