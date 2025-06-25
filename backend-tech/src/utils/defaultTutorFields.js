const defaultFields = {
  experience: {
    maths: [
      {
        company: "BrightMinds EdTech",
        role: "Lead Math Tutor (Full-time)",
        description: "Conducted live online classes for grades 8-12, developed digital courseware, and mentored junior tutors. Achieved 95% student satisfaction rate."
      },
      {
        company: "MathMaster Academy",
        role: "Senior Mathematics Instructor",
        description: "Specialized in advanced calculus and statistics, created comprehensive study materials, and led workshops for competitive exam preparation."
      },
      {
        company: "EduTech Solutions",
        role: "Mathematics Curriculum Developer",
        description: "Designed innovative math curriculum for K-12, implemented gamified learning approaches, and trained teachers in modern teaching methodologies."
      },
      {
        company: "Global Math Institute",
        role: "Mathematics Specialist",
        description: "Focused on Olympiad training, developed problem-solving strategies, and mentored students for international competitions."
      },
      {
        company: "SmartMath Learning",
        role: "Mathematics Education Consultant",
        description: "Created personalized learning paths, implemented adaptive learning technologies, and conducted teacher training programs."
      }
    ],
    physics: [
      {
        company: "PhysicsFirst Institute",
        role: "Senior Physics Educator",
        description: "Specialized in Mechanics and Electromagnetism, developed virtual physics labs, and created engaging physics experiments for online learning."
      },
      {
        company: "Quantum Learning Academy",
        role: "Physics Curriculum Specialist",
        description: "Designed comprehensive physics curriculum, integrated practical experiments with theoretical concepts, and trained teachers in modern physics education."
      },
      {
        company: "Physics Excellence Center",
        role: "Physics Research Coordinator",
        description: "Led physics research projects, mentored students in scientific methodology, and organized physics competitions and science fairs."
      },
      {
        company: "Physics Education Solutions",
        role: "Physics Education Consultant",
        description: "Developed innovative teaching methodologies, created virtual lab experiences, and implemented STEM-focused learning programs."
      },
      {
        company: "Physics Mastery Institute",
        role: "Lead Physics Instructor",
        description: "Conducted advanced physics classes, developed interactive learning materials, and mentored students for competitive exams."
      }
    ],
    chemistry: [
      {
        company: "ChemLearn Academy",
        role: "Senior Chemistry Educator",
        description: "Specialized in Organic and Physical Chemistry, developed virtual chemistry labs, and created engaging chemistry experiments for online learning."
      },
      {
        company: "Chemistry Excellence Center",
        role: "Chemistry Curriculum Specialist",
        description: "Designed comprehensive chemistry curriculum, integrated practical experiments with theoretical concepts, and trained teachers in modern chemistry education."
      },
      {
        company: "Chemistry Research Institute",
        role: "Chemistry Research Coordinator",
        description: "Led chemistry research projects, mentored students in laboratory techniques, and organized chemistry competitions and science fairs."
      },
      {
        company: "Chemistry Education Solutions",
        role: "Chemistry Education Consultant",
        description: "Developed innovative teaching methodologies, created virtual lab experiences, and implemented STEM-focused learning programs."
      },
      {
        company: "Chemistry Mastery Institute",
        role: "Lead Chemistry Instructor",
        description: "Conducted advanced chemistry classes, developed interactive learning materials, and mentored students for competitive exams."
      }
    ],
    science: [
      {
        company: "LearnOnline Academy",
        role: "Science Tutor (Part-time)",
        description: "Taught Biology and Environmental Science to high school students, created interactive quizzes, and provided 1:1 mentoring."
      },
      {
        company: "ScienceFirst Institute",
        role: "Senior Science Educator",
        description: "Specialized in Biology and Environmental Science, developed laboratory simulations, and created engaging science experiments for online learning."
      },
      {
        company: "EduScience Solutions",
        role: "Science Curriculum Specialist",
        description: "Designed comprehensive science curriculum, integrated practical experiments with theoretical concepts, and trained teachers in modern science education."
      },
      {
        company: "Global Science Academy",
        role: "Science Research Coordinator",
        description: "Led science research projects, mentored students in scientific methodology, and organized science fairs and competitions."
      },
      {
        company: "Innovative Science Learning",
        role: "Science Education Consultant",
        description: "Developed innovative teaching methodologies, created virtual lab experiences, and implemented STEM-focused learning programs."
      }
    ]
  },

  skills: {
    maths: [
      ["Online Teaching", "Curriculum Design", "Student Mentoring", "Assessment Creation", "Problem Solving", "Data Analysis"],
      ["Mathematical Modeling", "Educational Technology", "Student Assessment", "Learning Analytics", "Critical Thinking"],
      ["Advanced Mathematics", "Teaching Methodologies", "Student Engagement", "Performance Analysis", "Educational Research"],
      ["Mathematical Software", "Curriculum Development", "Student Support", "Quality Assurance", "Educational Leadership"],
      ["Mathematics Education", "Digital Learning", "Student Success", "Program Development", "Educational Innovation"]
    ],
    physics: [
      ["Physics Education", "Laboratory Management", "Scientific Research", "Student Mentoring", "Physics Communication"],
      ["Physics Teaching", "Experimental Design", "Data Analysis", "Student Assessment", "STEM Integration"],
      ["Physics Methodology", "Educational Technology", "Research Coordination", "Student Engagement", "Physics Outreach"],
      ["Physics Curriculum", "Laboratory Safety", "Student Support", "Research Development", "Educational Leadership"],
      ["Physics Education", "Digital Learning", "Student Success", "Program Development", "Physics Innovation"]
    ],
    chemistry: [
      ["Chemistry Education", "Laboratory Management", "Scientific Research", "Student Mentoring", "Chemistry Communication"],
      ["Chemistry Teaching", "Experimental Design", "Data Analysis", "Student Assessment", "STEM Integration"],
      ["Chemistry Methodology", "Educational Technology", "Research Coordination", "Student Engagement", "Chemistry Outreach"],
      ["Chemistry Curriculum", "Laboratory Safety", "Student Support", "Research Development", "Educational Leadership"],
      ["Chemistry Education", "Digital Learning", "Student Success", "Program Development", "Chemistry Innovation"]
    ],
    science: [
      ["Online Teaching", "Laboratory Management", "Scientific Research", "Student Mentoring", "Science Communication"],
      ["Science Education", "Experimental Design", "Data Analysis", "Student Assessment", "STEM Integration"],
      ["Scientific Methodology", "Educational Technology", "Research Coordination", "Student Engagement", "Science Outreach"],
      ["Science Curriculum", "Laboratory Safety", "Student Support", "Research Development", "Educational Leadership"],
      ["Science Teaching", "Digital Learning", "Student Success", "Program Development", "Scientific Innovation"]
    ]
  },

  unique_qualities: {
    maths: [
      "Known for making complex mathematical concepts simple and engaging. Uses real-life examples, interactive quizzes, and adaptive teaching methods.",
      "Expert at breaking down complex mathematical problems into understandable steps. Creates an engaging learning environment through interactive problem-solving.",
      "Specializes in making abstract mathematical concepts tangible through practical applications and visual learning techniques.",
      "Masters the art of explaining complex mathematical theories through relatable examples and interactive demonstrations.",
      "Excels at creating a supportive learning environment where students feel comfortable exploring mathematical concepts."
    ],
    physics: [
      "Expert at making physics concepts accessible through hands-on experiments and real-world applications. Creates an engaging learning environment.",
      "Known for connecting theoretical physics with practical applications. Uses interactive demonstrations and real-world examples.",
      "Specializes in making complex physics principles understandable through visual aids and interactive experiments.",
      "Masters the art of explaining physics concepts through engaging demonstrations and practical applications.",
      "Excels at creating an interactive learning environment where students can explore physics concepts hands-on."
    ],
    chemistry: [
      "Expert at making chemistry concepts accessible through hands-on experiments and real-world applications. Creates an engaging learning environment.",
      "Known for connecting theoretical chemistry with practical applications. Uses interactive demonstrations and real-world examples.",
      "Specializes in making complex chemistry principles understandable through visual aids and interactive experiments.",
      "Masters the art of explaining chemistry concepts through engaging demonstrations and practical applications.",
      "Excels at creating an interactive learning environment where students can explore chemistry concepts hands-on."
    ],
    science: [
      "Expert at making scientific concepts accessible through hands-on experiments and real-world applications. Creates an engaging learning environment.",
      "Known for connecting theoretical science with practical applications. Uses interactive demonstrations and real-world examples.",
      "Specializes in making complex scientific principles understandable through visual aids and interactive experiments.",
      "Masters the art of explaining scientific concepts through engaging demonstrations and practical applications.",
      "Excels at creating an interactive learning environment where students can explore scientific concepts hands-on."
    ]
  },

  student_testimonials: {
    maths: [
      "Great at breaking down complex topics. The tutor used visuals and analogies that made things click. My understanding has deepened a lot.",
      "Helped me understand tough concepts easily! The tutor always made sure I was comfortable with every topic. I feel much more confident now.",
      "Classes are always interactive and fun. I never felt bored or lost during the lessons. The learning environment was very supportive.",
      "The tutor's approach to teaching math is unique. Complex problems became simple puzzles to solve. My grades have improved significantly.",
      "Amazing at explaining difficult concepts. The tutor's patience and clear explanations made learning math enjoyable.",
      "The tutor's teaching methods are innovative. They make math interesting and relevant to real life. I've never been more confident in math.",
      "Outstanding ability to simplify complex mathematical concepts. The tutor's enthusiasm is contagious and makes learning fun.",
      "The tutor's dedication to student success is remarkable. They go above and beyond to ensure everyone understands the concepts.",
      "Excellent at identifying and addressing individual learning needs. The personalized approach has made a huge difference.",
      "The tutor's teaching style is engaging and effective. They make challenging topics accessible and enjoyable to learn."
    ],
    physics: [
      "The tutor makes physics come alive! Their experiments and demonstrations helped me understand complex concepts easily.",
      "Amazing at explaining physics principles. The tutor's practical approach makes learning physics fun and engaging.",
      "The tutor's enthusiasm for physics is contagious. They make every topic interesting and relevant to real life.",
      "Outstanding ability to simplify complex physics concepts. The hands-on approach makes learning much more effective.",
      "The tutor's teaching methods are innovative. They connect theory with practical applications in a way that's easy to understand.",
      "Excellent at making physics accessible. The tutor's clear explanations and demonstrations make learning enjoyable.",
      "The tutor's dedication to student understanding is remarkable. They ensure everyone grasps the concepts thoroughly.",
      "Great at creating an interactive learning environment. The practical experiments make physics concepts crystal clear.",
      "The tutor's approach to teaching physics is unique. They make complex topics simple and interesting to learn.",
      "Outstanding ability to engage students in physics learning. The tutor's enthusiasm makes every class enjoyable."
    ],
    chemistry: [
      "The tutor makes chemistry come alive! Their experiments and demonstrations helped me understand complex concepts easily.",
      "Amazing at explaining chemistry principles. The tutor's practical approach makes learning chemistry fun and engaging.",
      "The tutor's enthusiasm for chemistry is contagious. They make every topic interesting and relevant to real life.",
      "Outstanding ability to simplify complex chemistry concepts. The hands-on approach makes learning much more effective.",
      "The tutor's teaching methods are innovative. They connect theory with practical applications in a way that's easy to understand.",
      "Excellent at making chemistry accessible. The tutor's clear explanations and demonstrations make learning enjoyable.",
      "The tutor's dedication to student understanding is remarkable. They ensure everyone grasps the concepts thoroughly.",
      "Great at creating an interactive learning environment. The practical experiments make chemistry concepts crystal clear.",
      "The tutor's approach to teaching chemistry is unique. They make complex topics simple and interesting to learn.",
      "Outstanding ability to engage students in chemistry learning. The tutor's enthusiasm makes every class enjoyable."
    ],
    science: [
      "The tutor makes science come alive! Their experiments and demonstrations helped me understand complex concepts easily.",
      "Amazing at explaining scientific principles. The tutor's practical approach makes learning science fun and engaging.",
      "The tutor's enthusiasm for science is contagious. They make every topic interesting and relevant to real life.",
      "Outstanding ability to simplify complex scientific concepts. The hands-on approach makes learning much more effective.",
      "The tutor's teaching methods are innovative. They connect theory with practical applications in a way that's easy to understand.",
      "Excellent at making science accessible. The tutor's clear explanations and demonstrations make learning enjoyable.",
      "The tutor's dedication to student understanding is remarkable. They ensure everyone grasps the concepts thoroughly.",
      "Great at creating an interactive learning environment. The practical experiments make science concepts crystal clear.",
      "The tutor's approach to teaching science is unique. They make complex topics simple and interesting to learn.",
      "Outstanding ability to engage students in scientific learning. The tutor's enthusiasm makes every class enjoyable."
    ]
  },

  ranks_awards: {
    maths: [
      ["Top 1% in National Math Olympiad", "Gold Medalist - State Mathematics Competition", "Best Online Math Tutor Award 2022"],
      ["National Mathematics Excellence Award", "Outstanding Mathematics Educator 2023", "Mathematics Teaching Innovation Award"],
      ["Mathematics Education Excellence Award", "Best Mathematics Curriculum Developer 2022", "Mathematics Teaching Innovation Prize"],
      ["Mathematics Teaching Excellence Award", "Outstanding Mathematics Educator 2023", "Mathematics Innovation Award"],
      ["Mathematics Education Leadership Award", "Best Mathematics Teacher 2022", "Mathematics Teaching Excellence Prize"]
    ],
    physics: [
      ["Gold Medalist - National Physics Olympiad", "Best Physics Educator Award 2022", "Physics Teaching Excellence Award"],
      ["National Physics Competition Winner", "Outstanding Physics Teacher 2023", "Physics Education Innovation Award"],
      ["Physics Education Excellence Award", "Best Physics Curriculum Developer 2022", "Physics Teaching Innovation Prize"],
      ["Physics Teaching Excellence Award", "Outstanding Physics Educator 2023", "Physics Innovation Award"],
      ["Physics Education Leadership Award", "Best Physics Teacher 2022", "Physics Teaching Excellence Prize"]
    ],
    chemistry: [
      ["Gold Medalist - National Chemistry Olympiad", "Best Chemistry Educator Award 2022", "Chemistry Teaching Excellence Award"],
      ["National Chemistry Competition Winner", "Outstanding Chemistry Teacher 2023", "Chemistry Education Innovation Award"],
      ["Chemistry Education Excellence Award", "Best Chemistry Curriculum Developer 2022", "Chemistry Teaching Innovation Prize"],
      ["Chemistry Teaching Excellence Award", "Outstanding Chemistry Educator 2023", "Chemistry Innovation Award"],
      ["Chemistry Education Leadership Award", "Best Chemistry Teacher 2022", "Chemistry Teaching Excellence Prize"]
    ],
    science: [
      ["Gold Medalist - State Science Talent Search", "Best Science Educator Award 2022", "Science Teaching Excellence Award"],
      ["National Science Olympiad Winner", "Outstanding Science Teacher 2023", "Science Education Innovation Award"],
      ["Science Education Excellence Award", "Best Science Curriculum Developer 2022", "Science Teaching Innovation Prize"],
      ["Science Teaching Excellence Award", "Outstanding Science Educator 2023", "Science Innovation Award"],
      ["Science Education Leadership Award", "Best Science Teacher 2022", "Science Teaching Excellence Prize"]
    ]
  },

  research_papers: {
    maths: [
      [
        {
          name: "Innovative Approaches to Online Math Education",
          subtext: "EdTech Journal, 2023"
        },
        {
          name: "Gamification in Mathematics Learning",
          subtext: "International Journal of e-Learning, 2022"
        }
      ],
      [
        {
          name: "Digital Transformation in Mathematics Education",
          subtext: "Journal of Educational Technology, 2023"
        },
        {
          name: "Adaptive Learning in Mathematics",
          subtext: "International Journal of Mathematics Education, 2022"
        }
      ],
      [
        {
          name: "Innovative Mathematics Teaching Methodologies",
          subtext: "Mathematics Education Journal, 2023"
        },
        {
          name: "Technology Integration in Mathematics Education",
          subtext: "Journal of Mathematics Learning, 2022"
        }
      ],
      [
        {
          name: "Mathematics Education in Digital Age",
          subtext: "Digital Education Review, 2023"
        },
        {
          name: "Innovative Approaches to Mathematics Learning",
          subtext: "Mathematics Teaching Journal, 2022"
        }
      ],
      [
        {
          name: "Mathematics Education Innovation",
          subtext: "Educational Innovation Journal, 2023"
        },
        {
          name: "Digital Learning in Mathematics",
          subtext: "Mathematics Education Review, 2022"
        }
      ]
    ],
    physics: [
      [
        {
          name: "Innovative Approaches to Online Physics Education",
          subtext: "Physics Education Journal, 2023"
        },
        {
          name: "Gamification in Physics Learning",
          subtext: "International Journal of Physics Education, 2022"
        }
      ],
      [
        {
          name: "Digital Transformation in Physics Education",
          subtext: "Journal of Physics Teaching, 2023"
        },
        {
          name: "Adaptive Learning in Physics",
          subtext: "International Journal of Physics Learning, 2022"
        }
      ],
      [
        {
          name: "Innovative Physics Teaching Methodologies",
          subtext: "Physics Education Review, 2023"
        },
        {
          name: "Technology Integration in Physics Education",
          subtext: "Journal of Physics Learning, 2022"
        }
      ],
      [
        {
          name: "Physics Education in Digital Age",
          subtext: "Digital Physics Education Review, 2023"
        },
        {
          name: "Innovative Approaches to Physics Learning",
          subtext: "Physics Teaching Journal, 2022"
        }
      ],
      [
        {
          name: "Physics Education Innovation",
          subtext: "Educational Innovation Journal, 2023"
        },
        {
          name: "Digital Learning in Physics",
          subtext: "Physics Education Review, 2022"
        }
      ]
    ],
    chemistry: [
      [
        {
          name: "Innovative Approaches to Online Chemistry Education",
          subtext: "Chemistry Education Journal, 2023"
        },
        {
          name: "Gamification in Chemistry Learning",
          subtext: "International Journal of Chemistry Education, 2022"
        }
      ],
      [
        {
          name: "Digital Transformation in Chemistry Education",
          subtext: "Journal of Chemistry Teaching, 2023"
        },
        {
          name: "Adaptive Learning in Chemistry",
          subtext: "International Journal of Chemistry Learning, 2022"
        }
      ],
      [
        {
          name: "Innovative Chemistry Teaching Methodologies",
          subtext: "Chemistry Education Review, 2023"
        },
        {
          name: "Technology Integration in Chemistry Education",
          subtext: "Journal of Chemistry Learning, 2022"
        }
      ],
      [
        {
          name: "Chemistry Education in Digital Age",
          subtext: "Digital Chemistry Education Review, 2023"
        },
        {
          name: "Innovative Approaches to Chemistry Learning",
          subtext: "Chemistry Teaching Journal, 2022"
        }
      ],
      [
        {
          name: "Chemistry Education Innovation",
          subtext: "Educational Innovation Journal, 2023"
        },
        {
          name: "Digital Learning in Chemistry",
          subtext: "Chemistry Education Review, 2022"
        }
      ]
    ],
    science: [
      [
        {
          name: "Innovative Approaches to Online Science Education",
          subtext: "Science Education Journal, 2023"
        },
        {
          name: "Gamification in Science Learning",
          subtext: "International Journal of Science Education, 2022"
        }
      ],
      [
        {
          name: "Digital Transformation in Science Education",
          subtext: "Journal of Science Teaching, 2023"
        },
        {
          name: "Adaptive Learning in Science",
          subtext: "International Journal of Science Learning, 2022"
        }
      ],
      [
        {
          name: "Innovative Science Teaching Methodologies",
          subtext: "Science Education Review, 2023"
        },
        {
          name: "Technology Integration in Science Education",
          subtext: "Journal of Science Learning, 2022"
        }
      ],
      [
        {
          name: "Science Education in Digital Age",
          subtext: "Digital Science Education Review, 2023"
        },
        {
          name: "Innovative Approaches to Science Learning",
          subtext: "Science Teaching Journal, 2022"
        }
      ],
      [
        {
          name: "Science Education Innovation",
          subtext: "Educational Innovation Journal, 2023"
        },
        {
          name: "Digital Learning in Science",
          subtext: "Science Education Review, 2022"
        }
      ]
    ]
  }
};

export const getRandomFields = (subject) => {
  const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
  const getRandomItems = (array, count) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Map subject to appropriate category
  let category = subject.toLowerCase();
  if (category === 'mathematics' || category === 'math') {
    category = 'maths';
  } else if (category !== 'physics' && category !== 'chemistry') {
    category = 'science';
  }

  return {
    experience: getRandomItem(defaultFields.experience[category]),
    skills: getRandomItem(defaultFields.skills[category]),
    unique_qualities: getRandomItem(defaultFields.unique_qualities[category]),
    student_testimonials: getRandomItems(defaultFields.student_testimonials[category], 3),
    ranks_awards: getRandomItem(defaultFields.ranks_awards[category]),
    research_papers: getRandomItem(defaultFields.research_papers[category])
  };
};

export default defaultFields; 