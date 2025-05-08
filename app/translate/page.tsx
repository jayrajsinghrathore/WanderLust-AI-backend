"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, Volume2, Copy, RotateCcw, ArrowRightLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

export default function TranslatePage() {
  const { toast } = useToast()
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [sourceLanguage, setSourceLanguage] = useState("en")
  const [targetLanguage, setTargetLanguage] = useState("ja")
  const [isTranslating, setIsTranslating] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const [recognition, setRecognition] = useState<any>(null)

  // LibreTranslate supports fewer languages than Google Translate
  const languages = [
    { value: "en", label: "English" },
    { value: "ja", label: "Japanese" },
    { value: "fr", label: "French" },
    { value: "es", label: "Spanish" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "zh", label: "Chinese" },
    { value: "pt", label: "Portuguese" },
    { value: "ru", label: "Russian" },
    { value: "ar", label: "Arabic" },
  ]

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputText(transcript)
        // Auto-translate after speech recognition
        handleTranslate(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)
        toast({
          title: "Error",
          description: `Speech recognition error: ${event.error}`,
          variant: "destructive",
        })
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognition)
    }
  }, [sourceLanguage, targetLanguage, toast])

  const handleTranslate = async (text = inputText) => {
    if (!text.trim()) return

    setIsTranslating(true)

    try {
      const response = await axios.post("/api/translate", {
        text,
        sourceLanguage,
        targetLanguage,
      })

      setOutputText(response.data.translatedText)
    } catch (error) {
      console.error("Translation error:", error)
      toast({
        title: "Translation Failed",
        description: "Unable to translate the text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard.",
    })
  }

  const handleClear = () => {
    setInputText("")
    setOutputText("")
  }

  const toggleListening = () => {
    if (recognition) {
      if (isListening) {
        recognition.stop()
      } else {
        setIsListening(true)
        recognition.lang = sourceLanguage
        recognition.start()

        toast({
          title: "Listening...",
          description: "Speak now.",
        })
      }
    } else {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      })
    }
  }

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = targetLanguage
      speechSynthesis.speak(utterance)
    } else {
      toast({
        title: "Speech Synthesis Not Available",
        description: "Your browser doesn't support speech synthesis.",
        variant: "destructive",
      })
    }
  }

  const swapLanguages = () => {
    const temp = sourceLanguage
    setSourceLanguage(targetLanguage)
    setTargetLanguage(temp)

    const tempText = inputText
    setInputText(outputText)
    setOutputText(tempText)
  }

  const addToConversation = () => {
    if (!inputText.trim() || !outputText.trim()) return

    const newEntry = {
      sourceText: inputText,
      sourceLanguage,
      targetText: outputText,
      targetLanguage,
      timestamp: new Date(),
    }

    setConversationHistory((prev) => [...prev, newEntry])
    handleClear()

    toast({
      title: "Added to Conversation",
      description: "The translation has been added to your conversation history.",
    })
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Language Translation</h1>
          <p className="text-muted-foreground">
            Translate text and speech to communicate effectively during your travels
          </p>
        </div>

        <Card>
          <CardHeader>
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Text Translation</TabsTrigger>
                <TabsTrigger value="conversation">Conversation Mode</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <TabsContent value="text" className="mt-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language.value} value={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleClear()}>
                        <RotateCcw className="h-4 w-4" />
                        <span className="sr-only">Clear</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(inputText)} disabled={!inputText}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy</span>
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    placeholder="Enter text to translate..."
                    className="min-h-[200px] resize-none"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={toggleListening}
                      className={isListening ? "bg-primary text-primary-foreground" : ""}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {isListening ? "Listening..." : "Speak"}
                    </Button>

                    <Button onClick={() => handleTranslate()} disabled={!inputText || isTranslating}>
                      {isTranslating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        "Translate"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 relative">
                  <div className="flex justify-between items-center">
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language.value} value={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSpeak(outputText)}
                        disabled={!outputText}
                      >
                        <Volume2 className="h-4 w-4" />
                        <span className="sr-only">Speak</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(outputText)} disabled={!outputText}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy</span>
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    placeholder="Translation will appear here..."
                    className="min-h-[200px] resize-none"
                    value={outputText}
                    readOnly
                  />

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={swapLanguages} disabled={!outputText}>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Swap Languages
                    </Button>

                    <Button className="flex-1" disabled={!inputText || !outputText} onClick={addToConversation}>
                      Add to Conversation
                    </Button>
                  </div>

                  <Button
                    size="icon"
                    className="absolute top-1/2 -left-4 transform -translate-y-1/2 rounded-full hidden md:flex"
                    onClick={swapLanguages}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    <span className="sr-only">Swap languages</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="conversation" className="mt-0">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Conversation History</h2>
                <p className="text-muted-foreground">View your translation history and continue conversations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Your language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Their language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 mb-6 min-h-[300px] max-h-[500px] overflow-y-auto">
                <div className="space-y-4">
                  {conversationHistory.length > 0 ? (
                    conversationHistory.map((entry, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-start">
                          <div className="bg-background rounded-lg p-3 max-w-[80%]">
                            <p className="text-sm text-muted-foreground mb-1">
                              You (
                              {entry.sourceLanguage === "en"
                                ? "English"
                                : languages.find((l) => l.value === entry.sourceLanguage)?.label}
                              ):
                            </p>
                            <p>{entry.sourceText}</p>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <div className="bg-primary/10 rounded-lg p-3 max-w-[80%]">
                            <p className="text-sm text-muted-foreground mb-1">
                              Them (
                              {entry.targetLanguage === "ja"
                                ? "Japanese"
                                : languages.find((l) => l.value === entry.targetLanguage)?.label}
                              ):
                            </p>
                            <p>{entry.targetText}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p>No conversation history yet.</p>
                      <p className="text-sm">Translate something and add it to the conversation to get started.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button className="flex-1" variant={isListening ? "default" : "outline"} onClick={toggleListening}>
                  <Mic className="h-4 w-4 mr-2" />
                  {isListening ? "Listening..." : "Hold to Speak"}
                </Button>

                <Button className="flex-1" variant="outline" onClick={() => setConversationHistory([])}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Conversation
                </Button>
              </div>
            </CardContent>
          </TabsContent>

          <CardFooter className="bg-muted/30 p-6">
            <div className="w-full space-y-2">
              <h3 className="font-medium">Common Phrases</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  "Hello, how are you?",
                  "Where is the nearest train station?",
                  "I would like to order this, please.",
                  "How much does this cost?",
                  "Can you help me?",
                  "Thank you very much.",
                ].map((phrase, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start h-auto py-2 px-3"
                    onClick={() => {
                      setInputText(phrase)
                      setTimeout(() => handleTranslate(), 100)
                    }}
                  >
                    {phrase}
                  </Button>
                ))}
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
