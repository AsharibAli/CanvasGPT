"use client";
import React, { useEffect, useState, useCallback } from "react";
import Script from "next/script";

const CanvasGPT = () => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const initializeChatbot = useCallback(() => {
    if (window.Chatbot) {
      window.Chatbot.initFull({
        chatflowid: process.env.NEXT_PUBLIC_CHATFLOW_ID,
        apiHost: process.env.NEXT_PUBLIC_FLOWISE_API_HOST,
        theme: {
          button: {
            backgroundColor: "#000000",
            size: "medium",
            iconColor: "white",
          },
          chatWindow: {
            showTitle: true,
            title:
              "CanvasGPT 🤖 - Your AI Assistant for DSCVR Canvas Development ✨",
            welcomeMessage:
              "Welcome to CanvasGPT! I'm here to help you navigate the DSCVR Platform, answer your questions about developing canvases, and provide guidance on your next project. Let's build something amazing together!",
            errorMessage:
              "Oops! Something went wrong. Please try again later or check your internet connection.",
            backgroundColor: "#ffffff",
            fontSize: 16,
            botMessage: {
              backgroundColor: "#f7f8ff",
              textColor: "#000000",
              showAvatar: true,
              avatarSrc:
                "https://raw.githubusercontent.com/AsharibAli/project-images/main/dscvr-logo.jpeg",
            },
            userMessage: {
              backgroundColor: "#000000",
              textColor: "#ffffff",
              showAvatar: true,
              avatarSrc:
                "https://raw.githubusercontent.com/AsharibAli/project-images/main/usericon.png",
            },
            textInput: {
              placeholder: "Type your question here...",
              backgroundColor: "#ffffff",
              textColor: "#000000",
              sendButtonColor: "#000000",
              maxChars: 100,
              maxCharsWarningMessage:
                "You exceeded the characters limit. Please input less than 100 characters.",
              autoFocus: true,
              sendMessageSound: true,
              receiveMessageSound: true,
            },
            feedback: {
              color: "#000000",
            },
            footer: {
              textColor: "#000000",
              text: "Build with ❤️ by",
              company: "Asharib Ali",
              companyLink: "https://x.com/0xAsharib",
            },
          },
        },
      });
    }
  }, []);

  useEffect(() => {
    if (isScriptLoaded) {
      initializeChatbot();
    }
  }, [isScriptLoaded, initializeChatbot]);

  return (
    <div className="m-0">
      <flowise-fullchatbot></flowise-fullchatbot>
      <Script
        src="https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js"
        type="module"
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
      />
    </div>
  );
};

export default CanvasGPT;
