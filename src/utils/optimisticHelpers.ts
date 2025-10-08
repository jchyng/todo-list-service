import { startTransition } from "react";

/**
 * 낙관적 업데이트 헬퍼
 * @param setState - 상태 설정 함수
 * @param optimisticUpdate - 낙관적 업데이트 함수
 * @param asyncOperation - 비동기 작업
 * @param rollbackState - 롤백할 원본 상태
 * @param onError - 에러 콜백
 */
export async function executeOptimisticUpdate<T, R = void>(params: {
  setState: React.Dispatch<React.SetStateAction<T>>;
  optimisticUpdate: (prev: T) => T;
  asyncOperation: () => Promise<R>;
  rollbackState: T;
  onError?: (error: unknown) => void;
}): Promise<R | null> {
  const { setState, optimisticUpdate, asyncOperation, rollbackState, onError } = params;

  // 낙관적 업데이트
  startTransition(() => {
    setState(optimisticUpdate);
  });

  try {
    const result = await asyncOperation();
    return result;
  } catch (error) {
    // 에러 시 롤백
    setState(rollbackState);
    onError?.(error);
    return null;
  }
}

/**
 * 간단한 낙관적 업데이트 래퍼
 */
export function withOptimisticUpdate<T>(
  setState: React.Dispatch<React.SetStateAction<T>>,
  updateFn: (prev: T) => T
): void {
  startTransition(() => {
    setState(updateFn);
  });
}
