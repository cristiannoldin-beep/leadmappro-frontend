// @ts-nocheck
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FacebookLoginButtonProps {
    onSuccess: (code: string) => void;
    onError: (error: string) => void;
}

export function FacebookLoginButton({ onSuccess, onError }: FacebookLoginButtonProps) {
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // The Facebook App ID and Config ID should come from .env or DB.
    // We assume VITE_META_APP_ID and VITE_META_CONFIG_ID are present, 
    // or fallback to trying to fetch them.
    const appId = import.meta.env.VITE_META_APP_ID || "123456789"; 
    const configId = import.meta.env.VITE_META_CONFIG_ID || "987654321";

    useEffect(() => {
        // Load the Facebook SDK asynchronously
        if (document.getElementById("facebook-jssdk")) {
            setIsSdkLoaded(true);
            return;
        }

        window.fbAsyncInit = function () {
            window.FB.init({
                appId: appId,
                autoLogAppEvents: true,
                xfbml: true,
                version: "v19.0",
            });
            setIsSdkLoaded(true);
        };

        const script = document.createElement("script");
        script.id = "facebook-jssdk";
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
             // Cleanup logic if component unmounts quickly, but FB SDK is generally global.
        };
    }, [appId]);

    const handleLogin = () => {
        if (!isSdkLoaded || !window.FB) {
            toast({ title: "SDK nÃ£o carregado", description: "O Facebook SDK ainda nÃ£o foi carregado.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        window.FB.login(
            (response: any) => {
                setIsLoading(false);
                if (response.authResponse) {
                    const code = response.authResponse.code;
                    if (code) {
                        onSuccess(code);
                    } else {
                        onError("Token de acesso nÃ£o foi retornado pelo Facebook.");
                    }
                } else {
                    onError("UsuÃ¡rio cancelou o login ou nÃ£o autorizou totalmente a aplicaÃ§Ã£o.");
                }
            },
            {
                config_id: configId, // This triggers the Embedded Signup flow
                response_type: "code",
                override_default_response_type: true,
                extras: {
                    setup_params: {
                        headline: "Conecte sua conta WhatsApp Business",
                        description: "Acesse para enviar mensagens aos seus leads."
                    }
                }
            }
        );
    };

    return (
        <Button
            onClick={handleLogin}
            disabled={!isSdkLoaded || isLoading}
            className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold h-14 rounded-2xl shadow-xl transition-all"
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Facebook_logo_%28square%29.png/600px-Facebook_logo_%28square%29.png" alt="FB" className="h-6 w-6 mr-3 rounded-full" />
            )}
            {isLoading ? "Conectando..." : "Conectar Nuvem Meta Oficial"}
        </Button>
    );
}

// Global declaration for TS
declare global {
    interface Window {
        fbAsyncInit: () => void;
        FB: any;
    }
}
