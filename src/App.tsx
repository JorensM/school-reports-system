import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import RecordButton from './components/RecordButton'
import SendButton from './components/SendButton'
import clsx from 'clsx';
import RecordIcon from './components/RecordIcon';
import Spinner from './components/Spinner';
import api from './util/API';

class VoiceRecorder {

  supported: boolean = false;
  stream?: MediaStream;
  recorder?: MediaRecorder;

  chunks: Blob[] = [];
  lastRecording?: Blob;

  initialized: boolean = false;

  stopped: boolean = true;

  constructor() {
    
  }

  async initialize() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log("getUserMedia supported.");
      const stream = await navigator.mediaDevices
        .getUserMedia(
          // constraints - only audio needed for this app
          {
            audio: true,
          },
        );

      this.supported = true;
      this.stream = stream;
      this.recorder = new MediaRecorder(this.stream);
      this.recorder.ondataavailable = (e) => {
        this.chunks.push(e.data);
        this.lastRecording = new Blob(this.chunks, { type: "audio/ogg; codecs=opus" });
      }
    }
      this.initialized = true;
  }

  record() {
    //eslint-disable-next-line
    return new Promise(async (resolve) => {
      if(!this.initialized) {
        await this.initialize();
      }
      if(!this.supported) {
        alert('Audio recording not supported.');
        return;
      }
      this.lastRecording = undefined;
      this.stopped = false;
      this.chunks = [];
      this.recorder!.start();
      resolve(true);
    })
    
  }

  stopRecording(): Promise<Blob> {
    this.stopped = true;
    this.recorder!.stop();

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if(this.lastRecording) {
          resolve(this.lastRecording);
          clearInterval(interval);
        }
      }, 400);
    });
  }
}

function App() {

  const [showRecordingOverlay, _setShowRecordingOverlay] = useState<boolean>(false);
  const [recordingOverlayOpacity, setRecordingOverlayOpacity] = useState<number>(0);

  const [recordingState, setRecordingState] = useState<'recording' | 'processing' | null>(null);

  const [reportDetailsValue, setReportDetailsValue] = useState<string>('');

  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  const handleReportDetailsInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setReportDetailsValue(e.currentTarget.value);
  }

  const recorderRef = useRef(new VoiceRecorder());

  const setShowRecordingOverlay = (show: boolean) => {
    if(show) {
      _setShowRecordingOverlay(true);
      setTimeout(() => {
        setRecordingOverlayOpacity(1);
      }, 100);
    } else {
      setRecordingOverlayOpacity(0);
      setTimeout(() => {
        _setShowRecordingOverlay(false);
      }, 500);
    }
  }

  const startRecording = () => {
    recorderRef.current.record().then(() => {
      setShowRecordingOverlay(true);
      setRecordingState('recording');
    });
  };

  const finishRecording = async () => {
    // setShowRecordingOverlay(false);
    setRecordingState('processing');
    const recording = await recorderRef.current.stopRecording();

    const res = await api.transcribe(recording);
    setReportDetailsValue(res.data);
    setShowRecordingOverlay(false);
    setRecordingState('recording');
  }

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitted(true);
  }

  const resetForm = () => {
    setReportDetailsValue("");
    setFormSubmitted(false);
  }

  return (
    <>
      {/* Recording overlay */}
      <div
        className={clsx(
          showRecordingOverlay || 'hidden',
          'transition-opacity duration-300 bg-neutral-500/50 absolute h-screen w-screen',
          'flex flex-col items-center justify-center gap-6'
        )}
        style={{
          opacity: recordingOverlayOpacity,
        }}
      >
        {recordingState === 'recording' ? 
          <>
            <div className='recording-outline rounded-full aspect-square flex flex-col items-center justify-center p-4'>
            
            <RecordIcon
              className='size-16 text-black'
            />
            <span className='text-black'>Recording</span>
            </div>
            <button
              onClick={finishRecording}
            >
              Done
            </button>
          </>
        : recordingState === 'processing' ?
        <>
          <Spinner 
            className='h-14 w-14'
          />
          <span className='text-black'>Processing</span>
        </>
        : null }
      </div>
      <div className='flex flex-col justify-center w-full h-full p-2 items-center'>
        {/* Report form */}
        <form 
          className='flex flex-col w-full max-w-[400px] gap-1'
          onSubmit={handleFormSubmit}
        >
          <label
            htmlFor='report-details'
          >
            Report Details
          </label>
          <textarea
            className={'bg-neutral-200 border border-neutral-700 rounded-md ' + 
              'h-[140px] text-neutral-700 p-1 outline-offset-2 transition-all duration-200 ' + 
              'focus-within:ring-2 focus-within:ring-amber-500 focus-within:outline-0'
            }
            id='report-details'
            name='report-details'
            onChange={handleReportDetailsInputChange}
            value={reportDetailsValue}
            required
          >

          </textarea>
          <div className='flex items-center justify-between'>
            {
              formSubmitted ?
                <>
                  <span>
                    Report submitted.
                  </span>
                  <button
                    onClick={resetForm}
                  >
                    New report
                  </button>
                </>
              : 
              <>
                <SendButton 
                />
                <RecordButton 
                  onClick={startRecording}
                  type='button'
                />
              </>
            }
          </div>
        </form>
      </div>
    </>
    
  )
}

export default App
