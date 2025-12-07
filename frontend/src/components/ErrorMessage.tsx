import { BaseError, ContractFunctionRevertedError } from "viem";

interface ErrorMessageProps {
    error: (Error & { shortMessage?: string }) | null;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
    if (!error) return null;

    let message = "Une erreur est survenue";

    if (error instanceof BaseError) {
        // Try to get the revert error
        const revertError = error.walk((err) => err instanceof ContractFunctionRevertedError);

        if (revertError instanceof ContractFunctionRevertedError) {
            const errorName = revertError.data?.errorName;

            // Custom error messages
            const errorMessages: Record<string, string> = {
                "Wallegacy__WillAlreadySet": "Ce testateur possède déjà un testament",
                "Wallegacy__NotNotary": "Vous n'êtes pas enregistré comme notaire",
                "OwnableUnauthorizedAccount": "Vous n'êtes pas le propriétaire",
            };

            message = errorMessages[errorName || ""] || error.shortMessage || error.message;
        } else {
            message = error.shortMessage || error.message;
        }
    } else {
        message = error.shortMessage || error.message;
    }

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{message}</p>
        </div>
    );
}