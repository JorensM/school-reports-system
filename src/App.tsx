import { useState } from 'react';
import RecordButton from './components/RecordButton'
import SendButton from './components/SendButton'
import clsx from 'clsx';
import RecordIcon from './components/RecordIcon';

function App() {

  const [showRecordingOverlay, setShowRecordingOverlay] = useState<boolean>(false);
  const [recordingOverlayOpacity, setRecordingOverlayOpacity] = useState<number>(0);

  const startRecording = () => {
    setShowRecordingOverlay(true);
    setTimeout(() => {
      setRecordingOverlayOpacity(1);
    }, 100);
  }

  return (
    <>
      {/* Recording overlay */}
      <div
        className={clsx(
          showRecordingOverlay || 'hidden',
          'transition-opacity duration-300 bg-neutral-500/50 absolute h-screen w-screen',
          'flex flex-col items-center justify-center'
        )}
        style={{
          opacity: recordingOverlayOpacity,
        }}
      >
        <div className='recording-outline'>
          <RecordIcon
            className='size-16 text-black'
          />
          <span className='text-black'>Recording</span>
        </div>
      </div>
      <div className='flex flex-col justify-center w-full h-full p-2'>
        {/* Report form */}
        <form>
          <label
            htmlFor='report-details'
          >
            Report Details
          </label>
          <textarea
            className={'bg-neutral-200 border border-neutral-700 rounded-md ' + 
              'w-full max-w-[400px] h-[140px] text-neutral-700 p-1 outline-offset-2 transition-all duration-200 ' + 
              'focus-within:ring-2 focus-within:ring-amber-500 focus-within:outline-0'
            }
            id='report-details'
            name='report-details'
          >

          </textarea>
          <div className='flex justify-between'>
            <SendButton 
            />
            <RecordButton 
              onClick={startRecording}
              type='button'
            />
          </div>
        </form>
      </div>
    </>
    
  )
}

export default App
