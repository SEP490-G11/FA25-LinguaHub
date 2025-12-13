import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, FileText, FileSignature } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  renderText,
  processHtmlContent,
  quillViewerStyles,
  proseClasses,
} from '@/utils/textUtils';

interface Material {
  id: number;
  title: string;
  type: string;
  size: string;
  url: string;
}

interface ReadingLessonProps {
  duration: number;
  content: string | null;
  transcript: string | null;
  materials: Material[];
}

const ReadingLesson = ({
  duration,
  content,
  transcript,
  materials,
}: ReadingLessonProps) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <>
      {/* READING HEADER - Compact */}
      <Card className="mb-6 overflow-hidden shadow-md border-0">
        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">Bài đọc</h2>
                <p className="text-sm text-white/90">
                  Thời gian đọc ước tính: {duration} phút
                </p>
              </div>
            </div>
            <p className="text-sm text-white/80 hidden md:block">
              Khi bạn đọc xong, nhấn nút bên dưới.
            </p>
          </div>
        </motion.div>
      </Card>

      {/* CONTENT TABS */}
      <Card className="shadow-lg border-0">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white border-b p-0 h-auto rounded-none">
              <TabsTrigger
                value="transcript"
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 
                  data-[state=active]:border-blue-600 data-[state=active]:text-blue-600
                  rounded-none py-4 font-semibold"
              >
                <FileSignature className="w-4 h-4 mr-2" />
                Nội dung bài đọc
              </TabsTrigger>

              <TabsTrigger
                value="materials"
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 
                  data-[state=active]:border-blue-600 data-[state=active]:text-blue-600
                  rounded-none py-4 font-semibold"
              >
                <FileText className="w-4 h-4 mr-2" />
                Tài liệu
              </TabsTrigger>
            </TabsList>

            {/* MATERIALS TAB */}
            <TabsContent value="materials" className="p-8 bg-gray-50 min-h-[400px]">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Tài liệu bài học</span>
                </h3>

                {materials?.length ? (
                  <div className="grid grid-cols-1 gap-3">
                    {materials.map((material, index) => (
                      <motion.div
                        key={material.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="p-4 hover:shadow-md transition-all border border-gray-200 bg-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2.5 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>

                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm">
                                  {renderText(material.title)}
                                </h4>
                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {material.type}
                                  </Badge>
                                  <span>•</span>
                                  <span>{material.size}</span>
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              asChild
                            >
                              <a
                                href={material.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4 mr-1.5" />
                                Xem
                              </a>
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Không có tài liệu nào.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TRANSCRIPT TAB */}
            <TabsContent value="transcript" className="p-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
              <div className="max-w-4xl mx-auto">
                {/* Content Card with Clear Border */}
                <Card className="bg-white border-2 border-gray-200 shadow-lg rounded-xl overflow-hidden">
                  {/* Content Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <FileSignature className="w-5 h-5" />
                      Nội dung bài học
                    </h3>
                  </div>

                  {/* Content Body */}
                  <div className="px-8 py-10 bg-white">
                    <div
                      className={proseClasses}
                      dangerouslySetInnerHTML={{
                        __html:
                          processHtmlContent(content || transcript) ||
                          '<p class="text-gray-500 text-center py-12">Không có nội dung.</p>',
                      }}
                    />
                    {/* Quill-specific styles for viewing */}
                    <style>{quillViewerStyles}</style>
                  </div>
                </Card>

                {/* Reading Tips */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>💡 Mẹo: Đọc kỹ nội dung và ghi chú những điểm quan trọng để ghi nhớ tốt hơn.</span>
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </Card>
    </>
  );
};

export default ReadingLesson;
